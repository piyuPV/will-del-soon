"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';

export default function CreateChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    isPublic: true,
    maxParticipants: 10,
    endDate: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create challenge');
      }

      toast.success('Challenge created successfully!');
      router.push('/challenges');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-[#3E2723] mb-8">Create New Challenge</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Challenge Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border-2 border-[#3E2723]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="border-2 border-[#3E2723]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Target</Label>
          <Input
            id="target"
            name="target"
            value={formData.target}
            onChange={handleChange}
            required
            className="border-2 border-[#3E2723]"
            placeholder="e.g., 100 pushups per day"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Maximum Participants</Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={handleChange}
            required
            min="2"
            className="border-2 border-[#3E2723]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            required
            className="border-2 border-[#3E2723]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
          />
          <Label htmlFor="isPublic">Public Challenge</Label>
        </div>

        <div className="flex justify-end space-x-4">
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
            disabled={loading}
            className="bg-[#795548] hover:bg-[#5D4037] text-white"
          >
            {loading ? 'Creating...' : 'Create Challenge'}
          </Button>
        </div>
      </form>
    </div>
  );
} 