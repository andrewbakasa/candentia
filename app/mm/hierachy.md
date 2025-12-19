src/
├── app/
│   ├── (hq)/                       // High-Level Strategy & Governance
│   │   ├── rbm/                    // Performance vs. National Targets (RBM)
│   │   ├── compliance/             // Statutory Registry (NSSA, EMA, Factory Act)
│   │   └── finance/                // Accoustanding: Awaiting Funding vs Funded
│   ├── (logistics)/                // Movement & Fleet Management
│   │   ├── fleet/                  // Locomotive & Wagon Registry (Km Tracking)
│   │   ├── procurement/            // PO Lifecycle: Not Generated -> Funded
│   │   └── critical-areas/         // Automated AI "Hotspots" for Executive Action
│   ├── (engineering)/              // Technical Execution
│   │   ├── maintenance/            // MMM: Scheduled (PM), Corrective (CM), Predictive
│   │   ├── workshops/              // Heavy Overhaul & Reproduces (Manufacturing)
│   │   ├── work-orders/            // Daily Job Cards (Production vs Target)
│   │   └── quality/                // MQPs, Inspection Forms & Safety Sign-offs
│   ├── (workforce)/
│   │   └── staffing/               // Individual Production, Grades & Assignments
│   └── (records)/
│       └── global-search/          // Universal search for Locos, POs, and Job Cards
├── components/
│   ├── analytics/                  // Daily vs Target charts & ROI Gauges
│   ├── forms/                      // Dynamic Statutory & Quality Checklists
│   ├── tables/                     // Real-time Fleet Availability & Asset Logs
│   └── ui/                         // Base Design System components
├── types/                          // Schema-first TypeScript interfaces
│   ├── maintenance.d.ts            // PM/CM, Downtime, & Odometer types
│   ├── procurement.d.ts            // PO States & Vendor compliance
│   ├── compliance.d.ts             // NSSA, EMA, & Factory Act Status
│   └── workforce.d.ts              // RBM Scoring & Grade types
├── lib/
│   ├── engine/                     // Core Business Intelligence logic
│   │   ├── critical-analysis.ts    // Logic for "Areas to Attend"
│   │   ├── statutory-gate.ts       // Logic for NSSA/EMA/Factory Act blocks
│   │   ├── cost-calculator.ts      // ROI on "Reproduces" and Assets
│   │   └── trend-calculator.ts     // Variance & Moving Averages math
│   └── templates/                  // Master Quality Plans & Safety Forms
└── hooks/                          // Real-time state hooks for fleet & funding



src/
├── app/
│   ├── (hq)/
│   │   ├── strategy/
│   │   │   ├── planning/           // Master Strategic Plan & Budgeting
│   │   │   └── allocation/         // Distributing funds to Depots/Workshops
│   ├── (analytics)/
│   │   ├── variances/              // Activities not met as per timeline
│   │   ├── rework-costs/           // Measuring "Cost of Quality"
│   │   └── resource-utilization/   // Actual vs. Allocated resources
├── components/
│   ├── strategy/
│   │   ├── BudgetProgress.tsx      // Visualizing Burn-rate vs Allocation
│   │   └── GanttTimeline.tsx       // Master Schedule for Projects/Activities
│   ├── analytics/
│   │   ├── VarianceFilter.tsx      // Multi-criteria filter for overdue tasks
│   │   └── ReworkImpactChart.tsx   // Visualizing cost of re-doing work
├── lib/
│   ├── engine/
│   │   ├── variance-engine.ts      // Logic to flag unmet timelines
│   │   └── costing-engine.ts       // Aggregating labor + material costs