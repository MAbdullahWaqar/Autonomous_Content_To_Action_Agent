// ============================================================
// Sample Content for Demo Purposes
// Grounded examples across different domains with explicit realism
// ============================================================

export interface SampleContent {
  id: string;
  title: string;
  domain: string;
  icon: string;
  content: string;
}

export const SAMPLE_CONTENTS: SampleContent[] = [
  {
    id: 'supply-chain-port',
    title: 'Port Qasim Congestion Crisis',
    domain: 'Supply Chain',
    icon: '🚢',
    content: `INTERNAL SITREP - Port Qasim Operations (May 14, 2026)

CRITICAL: Container dwell time at Port Qasim Terminal 2 has spiked from a 3.2-day average to 14.5 days over the last 96 hours. The backlog is driven by an ongoing strike by the Customs Clearing Agents Association combined with the unexpected breakdown of two primary RTG (Rubber-Tyred Gantry) cranes at East Wharf.

CURRENT IMPACT:
- 1,240 TEUs of temperature-sensitive pharmaceutical precursors (mostly APIs for local manufacturers like Getz and Searle) are sitting with only 48 hours of backup generator fuel remaining for the reefers.
- Demurrage charges are accumulating at an estimated $42,000 per day across our client portfolio.
- Three major export shipments destined for Rotterdam (apparel for Zara and H&M, totaling $4.2M) missed their vessel cut-off times yesterday.

COMPETITIVE EXPOSURE:
Our competitor, Maersk Pakistan, has reportedly secured priority berthing at Karachi Port Trust (KPT) and is diverting their priority clients' cargo. We have received 14 escalation emails from Tier 1 accounts in the last 6 hours threatening to cancel Q3 contracts if this is not resolved.

IMMEDIATE REQUIREMENT:
We need a rerouting plan for incoming vessels to KPT or Gwadar, immediate allocation of emergency fuel for the reefers, and proactive client communications before the news hits the broader market tomorrow morning.`,
  },
  {
    id: 'finance-retail',
    title: 'Lahore Region Retail Default Risk',
    domain: 'Finance',
    icon: '🏦',
    content: `CREDIT RISK ALERT: Q2 2026 Lahore Retail Sector

Our automated telemetry indicates a severe liquidity crunch emerging among mid-tier retail distributors in the Lahore South zone. Across our portfolio of 450 SME borrowers in this sector, the 30-day delinquency rate has jumped from 2.1% in March to 8.4% in May.

UNDERLYING CAUSES:
- A recent 22% hike in commercial electricity tariffs.
- Slower inventory turnover (days sales of inventory increased from 42 to 68 days) due to inflationary pressure on consumer spending.
- The recent closure of the Main Boulevard access road for metro construction, severely impacting foot traffic for 85 of our clients.

SPECIFIC EXPOSURE:
Our total outstanding principal in this specific risk cohort is Rs. 1.25 Billion. The "Fashion & Apparel" sub-segment is showing the highest distress, with 12 accounts already breaching their covenants regarding inventory-to-debt ratios.

If this trend continues for another 30 days without intervention, our predictive models show a potential write-off of Rs. 180M, which would completely wipe out the regional branch's quarterly profit target and trigger a mandatory reserve requirement increase from the central bank. We need a restructuring protocol initiated immediately for the highest-risk accounts.`,
  },
  {
    id: 'tech-outage',
    title: 'AWS us-east-1 Outage Impact',
    domain: 'Business Operations',
    icon: '💻',
    content: `INCIDENT REPORT: AWS us-east-1 Degradation (P1)
Time: 14:30 PST

STATUS: 
Amazon Web Services is currently experiencing elevated error rates and latencies in the us-east-1 region, specifically affecting RDS (Relational Database Service) and ElastiCache. 

BUSINESS IMPACT:
- Our core user authentication service is failing for 65% of login attempts across the APAC region.
- The payment processing queue is backed up with 4,500 unconfirmed transactions (approximate value $125,000).
- Our customer support queue has spiked from an average of 40 tickets/hour to 850 tickets/hour in the last 90 minutes. SLA breaches will start occurring in 15 minutes.

SYSTEMS AFFECTED:
- Auth0 integration (Timeout)
- Postgres Primary DB (us-east-1a) -> Failing over to Replica (us-east-1b) but replication lag is currently 400 seconds.
- Redis Cache Clusters (All offline)

We are currently in a "code red" status. If we attempt a hard failover to us-west-2, we risk a data loss window of approximately 5 minutes (the replication lag before the incident). If we wait for AWS resolution, we continue to bleed revenue at a rate of $80,000 per hour. The VP of Engineering requires a decision within the next 10 minutes on whether to execute the cross-region failover protocol.`,
  }
];
