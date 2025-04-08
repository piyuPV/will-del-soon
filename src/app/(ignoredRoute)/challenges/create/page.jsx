"use client";
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  exerciseType: z.string({
    required_error: "Please select an exercise type",
  }),
  isPublic: z.boolean(),
  maxParticipants: z.coerce.number().int().min(2, "Minimum 2 participants"),
  endDate: z.string().refine(date => new Date(date) > new Date(), {
    message: "End date must be in the future",
  }),
  levels: z.array(
    z.object({
      number: z.coerce.number().int().min(1),
      required: z.coerce.number().int().min(1, "Required reps must be at least 1"),
    })
  ).min(1, "At least one level is required"),
});

const createChallenge = async (data) => {
  try {
    const response = await fetch('/api/challenges/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to create challenge');
    }

    toast.success('Challenge created successfully!');
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw new Error(error.message || 'Failed to create challenge');
  } 
}


export default function CreateChallengePage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      exerciseType: '',
      isPublic: true,
      maxParticipants: 10,
      endDate: '',
      levels: [
        { number: 1, required: 10 },
        { number: 2, required: 20 },
        { number: 3, required: 30 },
        { number: 4, required: 40 },
        { number: 5, required: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "levels",
  });

  const createChallengeMutation = useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries(['challenges']);
      router.push('/challenges');
    },
  })

  const onSubmit = async (data) => {
    try {
      toast.promise(createChallengeMutation.mutateAsync(data),{
        loading: 'Creating Challenge...',
        success: 'Challenge createdd successfully!',
        error: 'An error occurred while creating challenge Profile!'
      })
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error(error.message || 'Failed to create challenge');
    }
   
  };

  const addNewLevel = () => {
    const currentLevels = form.getValues("levels");
    const nextLevel = currentLevels.length + 1;
    const lastLevel = currentLevels[currentLevels.length - 1];
    const nextRequired = lastLevel ? lastLevel.required + 10 : 10;
    
    append({ number: nextLevel, required: nextRequired });
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold text-[#3E2723] mb-8">Create New Challenge</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#3E2723]">Challenge Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="border-2 border-[#3E2723] focus-visible:ring-[#795548]"
                  />
                </FormControl>
                <FormMessage className="text-[#D32F2F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#3E2723]">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="border-2 border-[#3E2723] focus-visible:ring-[#795548]"
                  />
                </FormControl>
                <FormMessage className="text-[#D32F2F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exerciseType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#3E2723]">Exercise Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="border-2 border-[#3E2723] focus:ring-[#795548]">
                      <SelectValue placeholder="Select exercise type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pushup">Push-up</SelectItem>
                    <SelectItem value="squat">Squat</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[#D32F2F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#3E2723]">Maximum Participants</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    min="2"
                    className="border-2 border-[#3E2723] focus-visible:ring-[#795548]"
                  />
                </FormControl>
                <FormMessage className="text-[#D32F2F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#3E2723]">End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    {...field}
                    className="border-2 border-[#3E2723] focus-visible:ring-[#795548]"
                  />
                </FormControl>
                <FormMessage className="text-[#D32F2F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 border-[#3E2723]">
                <div className="space-y-0.5">
                  <FormLabel className="text-[#3E2723]">Public Challenge</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-[#795548]"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#3E2723]">Levels</h3>
              <Button
                type="button"
                onClick={addNewLevel}
                variant="outline"
                size="sm"
                className="border-2 border-[#3E2723] text-[#3E2723] hover:bg-[#F9ECCC]"
              >
                <Plus size={16} className="mr-1" /> Add Level
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-3 rounded-lg bg-[#F9ECCC]">
                <FormField
                  control={form.control}
                  name={`levels.${index}.number`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[#3E2723]">Level {index + 1}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          disabled
                          value={index + 1}
                          className="border-2 border-[#3E2723] focus-visible:ring-[#795548] bg-[#EFEBE9]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`levels.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[#3E2723]">Required Reps</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          min="1"
                          className="border-2 border-[#3E2723] focus-visible:ring-[#795548]"
                        />
                      </FormControl>
                      <FormMessage className="text-[#D32F2F]" />
                    </FormItem>
                  )}
                />
                
                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mb-1 bg-[#D32F2F] hover:bg-[#B71C1C]"
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-2 border-[#3E2723] text-[#3E2723] hover:bg-[#F9ECCC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createChallengeMutation.isPending}
              className="bg-[#795548] hover:bg-[#5D4037] text-white"
            >
              {createChallengeMutation.isPending ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}