
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const BookingModal = ({ student, open, onClose }) => {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const { profile } = useAuth();

  const bookingOptions = [
    { duration: 30, price: 1000, label: '30 Minutes' },
    { duration: 60, price: 1500, label: '1 Hour' }
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const amount = selectedDuration === 30 ? 100000 : 150000; // in kobo
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          client_id: profile.id,
          student_id: student.id,
          scheduled_at: scheduledAt,
          duration: selectedDuration,
          amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Session Booked!',
        description: 'Your session has been booked. You will be charged when the student confirms.'
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time',
        variant: 'destructive'
      });
      return;
    }
    
    createSessionMutation.mutate();
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book a Session with {student.name}</DialogTitle>
          <DialogDescription>
            {student.departments?.name} Student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Duration Selection */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Duration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {bookingOptions.map((option) => (
                <motion.div
                  key={option.duration}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedDuration === option.duration 
                        ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedDuration(option.duration)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-semibold">{option.label}</div>
                      <div className="text-2xl font-bold text-indigo-600">
                        ₦{option.price.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Time Selection */}
          <div>
            <h3 className="font-semibold mb-3">Select Time</h3>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    selectedTime === time
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Student:</span>
                <span>{student.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{selectedDuration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>
                  {selectedDate && selectedTime 
                    ? `${selectedDate} at ${selectedTime}`
                    : 'Not selected'
                  }
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total:</span>
                <span>₦{(selectedDuration === 30 ? 1000 : 1500).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Book Button */}
          <Button 
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || createSessionMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {createSessionMutation.isPending ? 'Booking...' : 'Book Session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
