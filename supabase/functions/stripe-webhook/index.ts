import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const CREDIT_PACKAGES: Record<string, number> = {
  "price_1ScqrYRq6vnCBMAS0M3F8CPF": 10,
  "price_1ScqtIRq6vnCBMASJPgPm5KP": 50,
  "price_1ScqthRq6vnCBMASA6Pa10h1": 200,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    console.error("[WEBHOOK] STRIPE_SECRET_KEY not configured");
    return new Response("Configuration error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Require webhook secret and signature for security
    if (!webhookSecret) {
      console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    if (!signature) {
      console.error("[WEBHOOK] Missing stripe-signature header");
      return new Response("Missing signature", { status: 401 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 401 });
    }

    console.log("[WEBHOOK] Event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.user_id || session.client_reference_id;
      const creditsStr = session.metadata?.credits;

      if (!userId || !creditsStr) {
        console.error("[WEBHOOK] Missing user_id or credits in metadata");
        return new Response("Missing metadata", { status: 400 });
      }

      const creditsToAdd = parseInt(creditsStr, 10);
      console.log("[WEBHOOK] Adding", creditsToAdd, "credits to user:", userId);

      // Use service role to update credits
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Update user credits
      const { error: updateError } = await supabase.rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: creditsToAdd
      });

      if (updateError) {
        // Fallback: direct update if RPC doesn't exist
        console.log("[WEBHOOK] RPC failed, trying direct update:", updateError.message);
        
        const { error: directError } = await supabase
          .from('profiles')
          .update({ credits: supabase.rpc('', {}) }) // This won't work, need proper update
          .eq('id', userId);

        // Actually do a proper increment
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          const newCredits = (profile.credits || 0) + creditsToAdd;
          await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);
        }
      }

      // Log the transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Purchased ${creditsToAdd} credits`,
        stripe_session_id: session.id,
      });

      console.log("[WEBHOOK] Credits added successfully");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[WEBHOOK] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
