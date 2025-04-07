import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/model/user.model';
import connectDB from '@/lib/initializeDB';

export async function GET(request) {
  try {
    await connectDB(); // Ensure the database connection is established
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 }
      );
    }

    console.log('Processing OAuth code:', code);

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    console.log('OAuth tokens received:', tokens);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens);
      return NextResponse.json(
        { message: 'Failed to exchange authorization code for tokens' },
        { status: 400 }
      );
    }

    // Get user info with access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', userInfo);

    if (!userInfoResponse.ok) {
      console.error('User info retrieval failed:', userInfo);
      return NextResponse.json(
        { message: 'Failed to retrieve user information' },
        { status: 400 }
      );
    }

    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      // Create a new user in your database
      const newUser = new User({
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
      });
      user = await newUser.save();
      console.log('New user created:', user._id);
    } else {
      if (user.picture !== userInfo.picture) {
        user.picture = userInfo.picture;
      }
      await user.save();
      console.log('Existing user logged in:', user._id);
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';

    const userToken = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      }, 
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    console.log('JWT token generated for user');

    // Create a response object with redirect
    const dashboardUrl = '/dashboard'; // Using relative URL for same-origin redirects
    
    // Create a response with cookies
    const response = NextResponse.redirect(new URL(dashboardUrl, request.url));

    // Set the token in an HttpOnly cookie
    response.cookies.set({
      name: 'token',
      value: userToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    // Also set a non-httpOnly cookie with user's basic info for UI display
    const userInfo_safe = {
      name: user.name,
      email: user.email,
      picture: user.picture
    };
    
    response.cookies.set({
      name: 'user_info',
      value: JSON.stringify(userInfo_safe),
      httpOnly: false, // This allows JavaScript to read this cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    return response;

  } catch (error) {
    console.error('Google callback error:', error);
    
    // In case of error, redirect to login with error param
    const loginUrl = '/login?error=auth_failed';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
}