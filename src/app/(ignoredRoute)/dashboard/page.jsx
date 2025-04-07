"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { fetchUserProfile } from '../profile/page';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { FootprintsIcon, FlameIcon, MoonIcon, ScaleIcon, RulerIcon, ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';

// Mock data for charts
const mockWeeklyData = [
  { day: 'Mon', steps: 5000, calories: 350, sleep: 7 },
  { day: 'Tue', steps: 6200, calories: 400, sleep: 6.5 },
  { day: 'Wed', steps: 4800, calories: 320, sleep: 7.5 },
  { day: 'Thu', steps: 7500, calories: 450, sleep: 8 },
  { day: 'Fri', steps: 8200, calories: 500, sleep: 7 },
  { day: 'Sat', steps: 6800, calories: 420, sleep: 9 },
  { day: 'Sun', steps: 5500, calories: 380, sleep: 8.5 }
];

// Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function HealthMetricCard({ title, value, icon, suffix, color, description }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-${color}-100`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value} {suffix}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function GoalProgressCard({ progress }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Daily Goal Progress</CardTitle>
        <CardDescription>You're doing great! Keep it up!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{progress}% Complete</span>
            <span className="text-sm font-medium text-muted-foreground">Goal: 100%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full text-xs text-muted-foreground">
          <div>Morning</div>
          <div>Afternoon</div>
          <div>Evening</div>
        </div>
      </CardFooter>
    </Card>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();

  const { data: userProfile, isPending } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const cachedData = queryClient.getQueryData(["userProfile"]);
      if (!cachedData) {
        return (await fetchUserProfile()) || {
          weight: 60,
          height: 170,
          steps: 6000,
          caloriesBurned: 400,
          sleepHours: 7.5,
          dailyGoalProgress: 40
        };
      }
      return cachedData;
    },
  });

  // Use mock data if the actual data is missing
  const healthData = {
    weight: userProfile?.weight || 60,
    height: userProfile?.height || 170,
    steps: userProfile?.steps || 6000,
    caloriesBurned: userProfile?.caloriesBurned || 400,
    sleepHours: userProfile?.sleepHours || 7.5,
    dailyGoalProgress: userProfile?.dailyGoalProgress || 40
  };

  // Create data for the pie chart
  const dailyActivitiesData = [
    { name: 'Steps', value: 35 },
    { name: 'Exercise', value: 25 },
    { name: 'Sleep', value: 30 },
    { name: 'Food', value: 10 },
  ];

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ActivityIcon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">My Health Dashboard</h1>

      {/* Daily Goal Progress */}
      <div className="grid gap-4 mb-8">
        <GoalProgressCard progress={healthData.dailyGoalProgress} />
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <HealthMetricCard
          title="Steps"
          value={healthData.steps.toLocaleString()}
          icon={<FootprintsIcon className="h-5 w-5 text-blue-500" />}
          suffix="steps"
          color="blue"
          description="Daily step count"
        />
        <HealthMetricCard
          title="Calories Burned"
          value={healthData.caloriesBurned}
          icon={<FlameIcon className="h-5 w-5 text-orange-500" />}
          suffix="kcal"
          color="orange"
          description="Total calories burned today"
        />
        <HealthMetricCard
          title="Sleep"
          value={healthData.sleepHours}
          icon={<MoonIcon className="h-5 w-5 text-purple-500" />}
          suffix="hours"
          color="purple"
          description="Last night's sleep"
        />
      </div>

      {/* Physical Measurements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <HealthMetricCard
          title="Weight"
          value={healthData.weight}
          icon={<ScaleIcon className="h-5 w-5 text-green-500" />}
          suffix="kg"
          color="green"
          description="Current weight"
        />
        <HealthMetricCard
          title="Height"
          value={healthData.height}
          icon={<RulerIcon className="h-5 w-5 text-indigo-500" />}
          suffix="cm"
          color="indigo"
          description="Your height"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Steps Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Weekly Steps</CardTitle>
            <CardDescription>Your step count for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} steps`, 'Steps']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="steps" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Daily Activity Distribution</CardTitle>
            <CardDescription>How your activities contribute to your health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dailyActivitiesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dailyActivitiesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Weekly Sleep</CardTitle>
            <CardDescription>Your sleep hours for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 12]} />
                  <Tooltip
                    formatter={(value) => [`${value} hours`, 'Sleep']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calories Burned Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Weekly Calories Burned</CardTitle>
            <CardDescription>Your energy expenditure for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} kcal`, 'Calories']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="calories" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Tips */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Health Tips</CardTitle>
          <CardDescription>Simple ways to improve your health</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>Drink at least 8 glasses of water every day</li>
            <li>Try to get 30 minutes of activity daily</li>
            <li>Aim for 8 hours of sleep each night</li>
            <li>Eat colorful fruits and vegetables</li>
            <li>Take short breaks from sitting every hour</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;