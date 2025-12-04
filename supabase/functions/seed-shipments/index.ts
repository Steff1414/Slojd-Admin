import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CARRIERS = ['DHL', 'PostNord', 'Bring']

const generateTrackingNumber = (carrier: string): string => {
  const randomNum = () => Math.random().toString(36).substring(2, 10).toUpperCase()
  switch (carrier) {
    case 'DHL':
      return `DHL${randomNum()}`
    case 'PostNord':
      return `PN${Math.floor(Math.random() * 9000000000) + 1000000000}`
    case 'Bring':
      return `BR${Math.floor(Math.random() * 9000000000) + 1000000000}`
    default:
      return randomNum()
  }
}

const generateTrackingUrl = (carrier: string, trackingNumber: string): string => {
  switch (carrier) {
    case 'DHL':
      return `https://track.dhl.com/${trackingNumber}`
    case 'PostNord':
      return `https://tracking.postnord.com/${trackingNumber}`
    case 'Bring':
      return `https://tracking.bring.com/${trackingNumber}`
    default:
      return `https://tracking.example.com/${trackingNumber}`
  }
}

const getShipmentStatus = (orderDate: Date): 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' => {
  const now = new Date()
  const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceOrder < 1) {
    return 'CREATED'
  } else if (daysSinceOrder < 3) {
    return Math.random() > 0.3 ? 'IN_TRANSIT' : 'CREATED'
  } else if (daysSinceOrder < 7) {
    return Math.random() > 0.2 ? 'DELIVERED' : 'IN_TRANSIT'
  } else {
    // Older orders - 95% delivered, 5% failed
    return Math.random() > 0.05 ? 'DELIVERED' : 'FAILED'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, created_at')

    if (ordersError) {
      throw ordersError
    }

    // Fetch existing shipments to avoid duplicates
    const { data: existingShipments } = await supabase
      .from('shipments')
      .select('order_id')

    const existingOrderIds = new Set((existingShipments || []).map(s => s.order_id))

    const shipmentsToCreate = []

    for (const order of orders || []) {
      // Skip if shipment already exists
      if (existingOrderIds.has(order.id)) {
        continue
      }

      const orderDate = new Date(order.created_at)
      const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)]
      const trackingNumber = generateTrackingNumber(carrier)
      const status = getShipmentStatus(orderDate)

      // Calculate dates based on status
      let shippedAt: string | null = null
      let deliveredAt: string | null = null

      if (status !== 'CREATED') {
        const shippedDate = new Date(orderDate)
        shippedDate.setDate(shippedDate.getDate() + Math.floor(Math.random() * 2) + 1)
        shippedAt = shippedDate.toISOString()

        if (status === 'DELIVERED') {
          const deliveredDate = new Date(shippedDate)
          deliveredDate.setDate(deliveredDate.getDate() + Math.floor(Math.random() * 4) + 1)
          deliveredAt = deliveredDate.toISOString()
        }
      }

      shipmentsToCreate.push({
        order_id: order.id,
        shipment_number: `SHIP-${order.order_number}`,
        carrier,
        tracking_number: trackingNumber,
        tracking_url: generateTrackingUrl(carrier, trackingNumber),
        status,
        shipped_at: shippedAt,
        delivered_at: deliveredAt,
      })
    }

    // Insert shipments in batches
    if (shipmentsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('shipments')
        .insert(shipmentsToCreate)

      if (insertError) {
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: shipmentsToCreate.length,
        skipped: orders!.length - shipmentsToCreate.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
