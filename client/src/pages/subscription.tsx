import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Shield, Infinity } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import AdBanner from '@/components/ads/AdBanner';
import type { SubscriptionPlan } from '@shared/schema';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const CheckoutForm = ({ planId, onSuccess }: { planId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription?success=true',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Subscribe Now'}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
    enabled: isAuthenticated,
  });

  // Fetch current subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/login";
      }
    },
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/create', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      toast({
        title: "Subscription Created",
        description: "Please complete your payment to activate premium features.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Cancellation Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    createSubscriptionMutation.mutate(planId);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const onPaymentSuccess = () => {
    setClientSecret(null);
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    toast({
      title: "Payment Successful",
      description: "Welcome to premium! You now have unlimited compressions.",
    });
  };

  if (isLoading || plansLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const isPremium = subscriptionStatus?.tier === 'premium' && subscriptionStatus?.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
            <p className="text-slate-600 mt-2">Choose the plan that works best for you</p>
          </div>
        </div>
      </header>

      {/* Top Banner Ad */}
      <AdBanner slot="subscription_top" className="max-w-7xl mx-auto px-4" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        {isPremium && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Crown className="w-5 h-5 mr-2" />
                Premium Member
              </CardTitle>
              <CardDescription className="text-yellow-700">
                You have unlimited access to all compression features.
                {subscriptionStatus?.endsAt && (
                  <span className="block mt-1">
                    Renews on {new Date(subscriptionStatus.endsAt).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {clientSecret && selectedPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Complete Your Payment</CardTitle>
              <CardDescription>
                Secure payment processing powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm planId={selectedPlan} onSuccess={onPaymentSuccess} />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan: SubscriptionPlan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-slate-600">
                    /{plan.interval}
                  </span>
                </div>
                <CardDescription>
                  {plan.compressionLimit === -1 ? 'Unlimited' : plan.compressionLimit} compressions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : isPremium ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    {subscriptionStatus?.tier === 'premium' ? 'Active' : 'Upgrade to Premium'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending && selectedPlan === plan.id ? (
                      'Creating...'
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Infinity className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unlimited Compressions</h3>
              <p className="text-slate-600">Process as many images as you need without daily limits</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced Features</h3>
              <p className="text-slate-600">Access to batch processing and professional quality tools</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
              <p className="text-slate-600">Get help faster with dedicated premium support</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Banner Ad */}
      <AdBanner slot="subscription_bottom" className="max-w-7xl mx-auto px-4 mb-8" />
    </div>
  );
}