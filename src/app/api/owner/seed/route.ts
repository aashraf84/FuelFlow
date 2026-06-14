import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const generateSegment = (): string => {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return segment
  }
  return `FF-${generateSegment()}-${generateSegment()}-${generateSegment()}`
}

export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const existingPlans = await db.subscriptionPlan.count()
    const existingClients = await db.ownerClient.count()

    if (existingPlans > 0 || existingClients > 0) {
      return NextResponse.json(
        { error: 'Seed data already exists. Clear existing data before seeding.' },
        { status: 400 }
      )
    }

    // =====================================================
    // 1. Create Subscription Plans
    // =====================================================
    const starterPlan = await db.subscriptionPlan.create({
      data: {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for single-station fuel businesses getting started with digital management.',
        priceMonthly: 15000,
        priceAnnual: 150000,
        currency: 'PKR',
        maxStations: 1,
        maxDispensers: 4,
        maxUsers: 5,
        maxDevices: 10,
        features: JSON.stringify([
          '1 Station',
          'Up to 4 Dispensers',
          '5 User Accounts',
          'Basic Inventory Management',
          'Shift Management',
          'Daily Reports',
          'Email Support',
        ]),
        isPopular: false,
        isActive: true,
        sortOrder: 1,
      },
    })

    const professionalPlan = await db.subscriptionPlan.create({
      data: {
        name: 'Professional',
        slug: 'professional',
        description: 'Ideal for growing multi-station businesses with advanced operational needs.',
        priceMonthly: 45000,
        priceAnnual: 450000,
        currency: 'PKR',
        maxStations: 5,
        maxDispensers: 24,
        maxUsers: 25,
        maxDevices: 50,
        features: JSON.stringify([
          'Up to 5 Stations',
          'Up to 24 Dispensers',
          '25 User Accounts',
          'Advanced Inventory & ATG',
          'Fleet Card Management',
          'Loyalty Program',
          'Financial Reports & P&L',
          'API Access',
          'Priority Support',
        ]),
        isPopular: true,
        isActive: true,
        sortOrder: 2,
      },
    })

    const enterprisePlan = await db.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'For large-scale fuel retail networks requiring full ERP capabilities and white-glove support.',
        priceMonthly: 120000,
        priceAnnual: 1200000,
        currency: 'PKR',
        maxStations: 50,
        maxDispensers: 200,
        maxUsers: 100,
        maxDevices: 500,
        features: JSON.stringify([
          'Up to 50 Stations',
          'Up to 200 Dispensers',
          '100 User Accounts',
          'Full ERP Suite',
          'Advanced Analytics & AI',
          'OMS Integration',
          'White-label Options',
          'Dedicated Account Manager',
          '24/7 Phone Support',
          'Custom API Development',
          'SLA Guarantee',
        ]),
        isPopular: false,
        isActive: true,
        sortOrder: 3,
      },
    })

    // =====================================================
    // 2. Create Sample Clients
    // =====================================================
    const clients = await Promise.all([
      db.ownerClient.create({
        data: {
          companyName: 'Al-Falah Petroleum',
          slug: 'al-falah-petroleum',
          contactPerson: 'Ahmed Khan',
          email: 'ahmed@alfalahpetro.pk',
          phone: '+92-300-1234567',
          address: '123 Main Boulevard, Gulberg III',
          city: 'Lahore',
          state: 'Punjab',
          country: 'Pakistan',
          postalCode: '54000',
          website: 'https://alfalahpetro.pk',
          taxId: 'NTN-1234567-8',
          registrationNumber: 'SECP-2020-001234',
          industry: 'Fuel Retail',
          notes: 'Long-standing client, interested in expansion to 10 stations.',
          status: 'active',
        },
      }),
      db.ownerClient.create({
        data: {
          companyName: 'Shell Green Energy PK',
          slug: 'shell-green-energy-pk',
          contactPerson: 'Fatima Rizvi',
          email: 'fatima@shellgreen.pk',
          phone: '+92-321-9876543',
          address: '45 Clifton Block 5',
          city: 'Karachi',
          state: 'Sindh',
          country: 'Pakistan',
          postalCode: '75600',
          website: 'https://shellgreen.pk',
          taxId: 'NTN-7654321-0',
          registrationNumber: 'SECP-2019-005678',
          industry: 'Fuel & EV Charging',
          notes: 'EV charging pilot program client.',
          status: 'active',
        },
      }),
      db.ownerClient.create({
        data: {
          companyName: 'Peshawar Fuel Services',
          slug: 'peshawar-fuel-services',
          contactPerson: 'Bilal Afridi',
          email: 'bilal@peshfuels.pk',
          phone: '+92-333-5551234',
          address: '78 University Road',
          city: 'Peshawar',
          state: 'KPK',
          country: 'Pakistan',
          postalCode: '25000',
          industry: 'Fuel Retail',
          notes: 'New client, currently in trial period.',
          status: 'trial',
        },
      }),
      db.ownerClient.create({
        data: {
          companyName: 'Islamabad Premium Fuels',
          slug: 'islamabad-premium-fuels',
          contactPerson: 'Sana Malik',
          email: 'sana@ipfuels.pk',
          phone: '+92-345-1112233',
          address: '12 F-7 Markaz',
          city: 'Islamabad',
          state: 'ICT',
          country: 'Pakistan',
          postalCode: '44000',
          website: 'https://ipfuels.pk',
          taxId: 'NTN-9988776-5',
          registrationNumber: 'SECP-2021-008901',
          industry: 'Premium Fuel Retail',
          notes: 'Enterprise client with custom requirements.',
          status: 'active',
        },
      }),
      db.ownerClient.create({
        data: {
          companyName: 'Multan Diesel & Petrol',
          slug: 'multan-diesel-petrol',
          contactPerson: 'Imran Hussain',
          email: 'imran@multandiesel.pk',
          phone: '+92-300-9998877',
          address: '56 Bosan Road',
          city: 'Multan',
          state: 'Punjab',
          country: 'Pakistan',
          postalCode: '60000',
          industry: 'Fuel Retail',
          notes: 'Account suspended due to overdue payments.',
          status: 'suspended',
        },
      }),
    ])

    const [alFalah, shellGreen, peshawarFuel, islamabadPremium, multanDiesel] = clients

    // =====================================================
    // 3. Create Subscriptions
    // =====================================================
    const now = new Date()
    const subscriptions = await Promise.all([
      db.clientSubscription.create({
        data: {
          clientId: alFalah.id,
          planId: professionalPlan.id,
          status: 'active',
          billingCycle: 'monthly',
          startDate: new Date('2024-06-01'),
          currentPeriodStart: new Date('2025-02-01'),
          currentPeriodEnd: new Date('2025-03-01'),
          autoRenew: true,
        },
      }),
      db.clientSubscription.create({
        data: {
          clientId: shellGreen.id,
          planId: enterprisePlan.id,
          status: 'active',
          billingCycle: 'annual',
          startDate: new Date('2024-01-15'),
          currentPeriodStart: new Date('2025-01-15'),
          currentPeriodEnd: new Date('2026-01-15'),
          autoRenew: true,
        },
      }),
      db.clientSubscription.create({
        data: {
          clientId: peshawarFuel.id,
          planId: starterPlan.id,
          status: 'trial',
          billingCycle: 'monthly',
          startDate: new Date('2025-02-15'),
          trialEnd: new Date('2025-03-15'),
          currentPeriodStart: new Date('2025-02-15'),
          currentPeriodEnd: new Date('2025-03-15'),
          autoRenew: false,
          notes: '14-day trial started on Feb 15.',
        },
      }),
      db.clientSubscription.create({
        data: {
          clientId: islamabadPremium.id,
          planId: enterprisePlan.id,
          status: 'active',
          billingCycle: 'annual',
          startDate: new Date('2024-03-01'),
          currentPeriodStart: new Date('2025-03-01'),
          currentPeriodEnd: new Date('2026-03-01'),
          autoRenew: true,
        },
      }),
      db.clientSubscription.create({
        data: {
          clientId: multanDiesel.id,
          planId: starterPlan.id,
          status: 'past_due',
          billingCycle: 'monthly',
          startDate: new Date('2024-09-01'),
          currentPeriodStart: new Date('2025-01-01'),
          currentPeriodEnd: new Date('2025-02-01'),
          autoRenew: true,
          notes: 'Payment overdue since January.',
        },
      }),
    ])

    // =====================================================
    // 4. Create Invoices
    // =====================================================
    const invoices = await Promise.all([
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-0001',
          clientId: alFalah.id,
          subscriptionId: subscriptions[0].id,
          status: 'paid',
          issueDate: new Date('2025-02-01'),
          dueDate: new Date('2025-02-15'),
          paidDate: new Date('2025-02-10'),
          subtotal: 45000,
          taxRate: 16,
          taxAmount: 7200,
          total: 52200,
          paidAmount: 52200,
          balanceDue: 0,
          currency: 'PKR',
          terms: 'Payment due within 15 days of issue date.',
          items: {
            create: [
              { description: 'Professional Plan - Monthly Subscription (Feb 2025)', quantity: 1, unitPrice: 45000, amount: 45000, sortOrder: 0 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-0002',
          clientId: shellGreen.id,
          subscriptionId: subscriptions[1].id,
          status: 'paid',
          issueDate: new Date('2025-01-15'),
          dueDate: new Date('2025-01-30'),
          paidDate: new Date('2025-01-20'),
          subtotal: 1200000,
          taxRate: 16,
          taxAmount: 192000,
          total: 1392000,
          paidAmount: 1392000,
          balanceDue: 0,
          currency: 'PKR',
          terms: 'Annual subscription - advance payment.',
          items: {
            create: [
              { description: 'Enterprise Plan - Annual Subscription (2025)', quantity: 1, unitPrice: 1200000, amount: 1200000, sortOrder: 0 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-0003',
          clientId: islamabadPremium.id,
          subscriptionId: subscriptions[3].id,
          status: 'sent',
          issueDate: new Date('2025-03-01'),
          dueDate: new Date('2025-03-15'),
          subtotal: 1200000,
          taxRate: 16,
          taxAmount: 192000,
          total: 1392000,
          paidAmount: 0,
          balanceDue: 1392000,
          currency: 'PKR',
          terms: 'Payment due within 15 days of issue date.',
          items: {
            create: [
              { description: 'Enterprise Plan - Annual Subscription (2025-2026)', quantity: 1, unitPrice: 1200000, amount: 1200000, sortOrder: 0 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-0004',
          clientId: multanDiesel.id,
          subscriptionId: subscriptions[4].id,
          status: 'overdue',
          issueDate: new Date('2025-01-01'),
          dueDate: new Date('2025-01-15'),
          subtotal: 15000,
          taxRate: 16,
          taxAmount: 2400,
          total: 17400,
          paidAmount: 0,
          balanceDue: 17400,
          currency: 'PKR',
          notes: 'Second reminder sent on Feb 20.',
          terms: 'Payment due within 15 days of issue date.',
          items: {
            create: [
              { description: 'Starter Plan - Monthly Subscription (Jan 2025)', quantity: 1, unitPrice: 15000, amount: 15000, sortOrder: 0 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-0005',
          clientId: alFalah.id,
          subscriptionId: subscriptions[0].id,
          status: 'draft',
          issueDate: new Date('2025-03-01'),
          dueDate: new Date('2025-03-15'),
          subtotal: 45000,
          taxRate: 16,
          taxAmount: 7200,
          total: 52200,
          paidAmount: 0,
          balanceDue: 52200,
          currency: 'PKR',
          items: {
            create: [
              { description: 'Professional Plan - Monthly Subscription (Mar 2025)', quantity: 1, unitPrice: 45000, amount: 45000, sortOrder: 0 },
            ],
          },
        },
      }),
    ])

    // Add a partial payment to invoice 5 (alFalah March)
    // Actually, let's add a partial payment to the islamabadPremium invoice instead
    await db.invoicePayment.create({
      data: {
        invoiceId: invoices[2].id, // INV-2025-0003
        amount: 500000,
        method: 'bank_transfer',
        reference: 'TRX-2025-001234',
        paidAt: new Date('2025-03-05'),
        notes: 'First installment payment',
      },
    })

    // Update that invoice to reflect partial payment
    await db.invoice.update({
      where: { id: invoices[2].id },
      data: {
        paidAmount: 500000,
        balanceDue: 892000,
        status: 'partial',
      },
    })

    // =====================================================
    // 5. Create Quotations
    // =====================================================
    await Promise.all([
      db.quotation.create({
        data: {
          quotationNumber: 'QT-2025-0001',
          clientId: peshawarFuel.id,
          clientName: 'Peshawar Fuel Services',
          clientEmail: 'bilal@peshfuels.pk',
          clientPhone: '+92-333-5551234',
          status: 'sent',
          issueDate: new Date('2025-02-16'),
          validUntil: new Date('2025-03-16'),
          subtotal: 15000,
          taxRate: 16,
          taxAmount: 2400,
          total: 17400,
          currency: 'PKR',
          terms: 'Valid for 30 days from issue date.',
          items: {
            create: [
              { description: 'Starter Plan - Monthly Subscription', quantity: 1, unitPrice: 15000, amount: 15000, sortOrder: 0 },
            ],
          },
        },
      }),
      db.quotation.create({
        data: {
          quotationNumber: 'QT-2025-0002',
          clientId: alFalah.id,
          clientName: 'Al-Falah Petroleum',
          clientEmail: 'ahmed@alfalahpetro.pk',
          clientPhone: '+92-300-1234567',
          status: 'accepted',
          issueDate: new Date('2025-01-10'),
          validUntil: new Date('2025-02-10'),
          subtotal: 450000,
          taxRate: 16,
          taxAmount: 72000,
          total: 522000,
          currency: 'PKR',
          terms: 'Valid for 30 days from issue date.',
          internalNotes: 'Client negotiated 10% discount on annual plan. Approved by management.',
          items: {
            create: [
              { description: 'Professional Plan - Annual Subscription (10% discount applied)', quantity: 1, unitPrice: 450000, amount: 450000, sortOrder: 0 },
              { description: 'Additional Station Setup - 2 Stations', quantity: 2, unitPrice: 0, amount: 0, sortOrder: 1 },
            ],
          },
        },
      }),
      db.quotation.create({
        data: {
          quotationNumber: 'QT-2025-0003',
          clientId: null,
          clientName: 'Quetta Oil Company',
          clientEmail: 'info@quettaoil.pk',
          clientPhone: '+92-311-8889900',
          clientAddress: '34 Jinnah Road, Quetta',
          status: 'draft',
          issueDate: new Date('2025-03-01'),
          validUntil: new Date('2025-04-01'),
          subtotal: 120000,
          taxRate: 16,
          taxAmount: 19200,
          total: 139200,
          currency: 'PKR',
          notes: 'Prospective client interested in Professional plan for 3 stations.',
          items: {
            create: [
              { description: 'Professional Plan - Monthly Subscription (3 stations)', quantity: 3, unitPrice: 45000, amount: 135000, sortOrder: 0 },
              { description: 'Setup & Onboarding Fee (discounted)', quantity: 1, unitPrice: 5000, amount: 5000, sortOrder: 1 },
            ],
          },
        },
      }),
    ])

    // =====================================================
    // 6. Create License Keys
    // =====================================================
    const licenseKeys = await Promise.all([
      db.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          clientId: alFalah.id,
          planId: professionalPlan.id,
          status: 'assigned',
          maxStations: 5,
          maxDispensers: 24,
          maxUsers: 25,
          assignedAt: new Date('2024-06-01'),
          expiresAt: new Date('2025-06-01'),
        },
      }),
      db.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          clientId: shellGreen.id,
          planId: enterprisePlan.id,
          status: 'assigned',
          maxStations: 50,
          maxDispensers: 200,
          maxUsers: 100,
          assignedAt: new Date('2024-01-15'),
          expiresAt: new Date('2026-01-15'),
        },
      }),
      db.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          clientId: islamabadPremium.id,
          planId: enterprisePlan.id,
          status: 'assigned',
          maxStations: 50,
          maxDispensers: 200,
          maxUsers: 100,
          assignedAt: new Date('2024-03-01'),
          expiresAt: new Date('2026-03-01'),
        },
      }),
      db.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          planId: professionalPlan.id,
          status: 'available',
          maxStations: 5,
          maxDispensers: 24,
          maxUsers: 25,
        },
      }),
      db.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          planId: starterPlan.id,
          status: 'available',
          maxStations: 1,
          maxDispensers: 4,
          maxUsers: 5,
        },
      }),
    ])

    // =====================================================
    // 7. Create Client Devices
    // =====================================================
    await Promise.all([
      db.clientDevice.create({
        data: {
          clientId: alFalah.id,
          deviceName: 'POS Terminal - Station 1',
          deviceType: 'pos',
          serialNumber: 'POS-AF-001',
          macAddress: 'AA:BB:CC:DD:EE:01',
          ipAddress: '192.168.1.101',
          location: 'Gulberg Station - Counter 1',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: alFalah.id,
          deviceName: 'Dispenser Controller - Bay 1-4',
          deviceType: 'dispenser_controller',
          serialNumber: 'DC-AF-001',
          ipAddress: '192.168.1.201',
          location: 'Gulberg Station - Pump Island A',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: shellGreen.id,
          deviceName: 'POS Terminal - Clifton Main',
          deviceType: 'pos',
          serialNumber: 'POS-SG-001',
          macAddress: 'AA:BB:CC:DD:EE:10',
          ipAddress: '10.0.0.101',
          location: 'Clifton Station - Main Counter',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: shellGreen.id,
          deviceName: 'ATG Sensor - Underground Tank 1',
          deviceType: 'atg',
          serialNumber: 'ATG-SG-001',
          ipAddress: '10.0.0.301',
          location: 'Clifton Station - Tank Farm',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: shellGreen.id,
          deviceName: 'EV Charger Controller - Bay 1',
          deviceType: 'other',
          serialNumber: 'EVC-SG-001',
          ipAddress: '10.0.0.401',
          location: 'Clifton Station - EV Charging Area',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: islamabadPremium.id,
          deviceName: 'POS Terminal - F-7 Station',
          deviceType: 'pos',
          serialNumber: 'POS-IP-001',
          macAddress: 'AA:BB:CC:DD:EE:20',
          ipAddress: '172.16.0.101',
          location: 'F-7 Station - Premium Counter',
          status: 'active',
          lastSeenAt: new Date(),
        },
      }),
      db.clientDevice.create({
        data: {
          clientId: multanDiesel.id,
          deviceName: 'POS Terminal - Bosan Road',
          deviceType: 'pos',
          serialNumber: 'POS-MD-001',
          macAddress: 'AA:BB:CC:DD:EE:30',
          ipAddress: '192.168.10.101',
          location: 'Bosan Road Station - Counter',
          status: 'inactive',
          lastSeenAt: new Date('2025-01-20'),
          notes: 'Device went offline. Suspected network issue.',
        },
      }),
    ])

    // =====================================================
    // Summary
    // =====================================================
    return NextResponse.json({
      message: 'Owner module seed data created successfully',
      summary: {
        plans: 3,
        clients: 5,
        subscriptions: subscriptions.length,
        invoices: invoices.length,
        quotations: 3,
        licenseKeys: licenseKeys.length,
        devices: 7,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Owner Seed POST error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
