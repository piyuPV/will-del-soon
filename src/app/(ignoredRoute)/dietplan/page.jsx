"use client"

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from 'react-hot-toast'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchUserProfile } from '../profile/page'

// Define the form validation schema with Zod
const formSchema = z.object({
  age: z.coerce.number().min(1, "Age must be at least 1").max(120, "Age must be less than 120"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  weight: z.coerce.number().positive("Weight must be positive").max(500, "Weight seems too high"),
  height: z.coerce.number().positive("Height must be positive").max(300, "Height seems too high"),
  activity_level: z.enum(["low", "moderate", "high"], {
    required_error: "Please select your activity level",
  }),
  injury: z.string().optional(),
  allergy: z.string().optional(),
  time: z.coerce.number().positive("Time period must be positive"),
  time_unit: z.enum(["days", "weeks", "months"], {
    required_error: "Please select a time unit",
  }),
  goal: z.string().min(5, "Please provide a more detailed goal").max(500, "Goal is too long"),
})

export const calculateAge = (dob) => {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const fetchDietPlan = async (data) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_PY_URL}/diet-plan`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const result = await response.json()
      return result.diet_plan
  } catch (error) {
    console.error("Error fetching diet plan:", error)
    throw new Error("Failed to fetch diet plan")
  }
}

function DietPlanPage() {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dietPlan, setDietPlan] = useState(null)

  const { data: userProfile, isPending: isUserProfilePending } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const cachedData = queryClient.getQueryData(["userProfile"]);
      if (!cachedData) {
        return (await fetchUserProfile()) || {};
      }
      return cachedData;
    },
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: "",
      gender: "",
      weight: "",
      height: "",
      activity_level: "",
      injury: "",
      allergy: "",
      time: "",
      time_unit: "",
      goal: "",
    },
  })

  useEffect(() => {
    if (userProfile) {
      let calAge = ''
      if (userProfile.dob) {
        calAge = calculateAge(userProfile.dob);
      }
      form.reset({
        gender: userProfile.gender || "",
        weight: userProfile.weight || "",
        height: userProfile.height || "",
        age: parseInt(calAge),
        allergy: userProfile.allergies || "",
        injury: userProfile.injuries || "",
        activity_level: "",
        goal:"",
        time: "",
        time_unit: "",

      });
    }
  }, [userProfile, form]);

  const dietPlanMutation = useMutation({
    mutationFn: fetchDietPlan,
    onSuccess: (data) => {
      setDietPlan(data)
    }
  })

  async function onSubmit(values) {
    try {
      values.time = values.time.toString() + " " + values.time_unit
      const { time_unit, ...apiData } = values
      // Format the data to match backend requirements
      toast.promise(
        dietPlanMutation.mutateAsync(apiData), {
        loading: 'Fetching diet plan...',
        success: 'Your Diet plan is ready.',
        error: 'Error while creating your diet plan.',
      })
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="container p-5 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-start">Create Your Personalized Diet Plan</h1>

      {!dietPlan && !isUserProfilePending ? (
        <Card className="">
          <CardHeader>
            <CardTitle>Tell us about yourself</CardTitle>
            <CardDescription>Fill out the form below to get a personalized diet plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Age */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter your age" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gender */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter your weight" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Height */}
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter your height" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Activity Level */}
                  <FormField
                    control={form.control}
                    name="activity_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="moderate">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Duration */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Injury */}
                <FormField
                  control={form.control}
                  name="injury"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Injuries (if any)</FormLabel>
                      <FormControl>
                        <Input placeholder="List any injuries you have" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty if none</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Allergies */}
                <FormField
                  control={form.control}
                  name="allergy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies (if any)</FormLabel>
                      <FormControl>
                        <Input placeholder="List any food allergies" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty if none</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Goal */}
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Goal</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your fitness/health goals"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Examples: weight loss, muscle gain, improve health, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={dietPlanMutation.isPending}>
                  {dietPlanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Diet Plan...
                    </>
                  ) : (
                    "Generate Diet Plan"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Your Personalized Diet Plan</CardTitle>
            <CardDescription>
              Based on your inputs, we've created the following diet plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">
              {typeof dietPlan === 'string' ? dietPlan : JSON.stringify(dietPlan, null, 2)}
            </div>
            <Button
              className="mt-6"
              onClick={() => setDietPlan(null)}
            >
              Create Another Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DietPlanPage