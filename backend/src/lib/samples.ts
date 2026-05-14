// ============================================================
// Sample Content for Demo Purposes
// Pre-loaded examples across different domains
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
    id: 'logistics-fuel',
    title: 'Fuel Price Hike',
    domain: 'Logistics',
    icon: '🚛',
    content: `BREAKING: Pakistan's petroleum division has announced a 15% increase in diesel prices effective immediately, raising the per-liter cost from Rs. 290 to Rs. 333.50. This marks the third consecutive monthly increase, bringing the cumulative rise to 28% over the past quarter.

Industry sources report that major logistics operators including TCS, Leopards Courier, and BlueEx are already seeing fuel costs consume 35-40% of their operational budgets, up from 28% six months ago. Last-mile delivery companies operating fleets of 50+ vehicles in Punjab and Sindh are particularly affected.

The All Pakistan Goods Transporters Association has threatened a nationwide strike if prices are not rolled back within 72 hours. Meanwhile, e-commerce platforms Daraz and Foodpanda have reported a 12% increase in delivery complaints related to delays attributed to route optimization changes by logistics partners.

No official government response has been issued regarding potential subsidies for the transport sector.`,
  },
  {
    id: 'finance-rates',
    title: 'Interest Rate Change',
    domain: 'Finance',
    icon: '🏦',
    content: `The State Bank of Pakistan (SBP) has cut its benchmark interest rate by 200 basis points to 15%, signaling confidence in declining inflation which dropped to 11.8% in the latest reading. This is the fourth consecutive rate cut in 2024-25.

Banking sector analysts at Topline Securities note that SME lending, which had contracted by 18% during the high-rate cycle, is expected to rebound. The Pakistan Microfinance Network reports that 2.3 million active borrowers — predominantly small retailers and agricultural producers in rural Sindh and Southern Punjab — stand to benefit from lower borrowing costs.

However, bank deposit rates are also falling, with major banks offering 12-13% on savings accounts down from 18% six months ago. The Pakistan Stock Exchange KSE-100 index rallied 3.2% on the announcement, with banking stocks leading gains.

Real estate developers in Lahore and Islamabad report a 20% surge in buyer inquiries following the announcement, suggesting capital may flow back into property markets.`,
  },
  {
    id: 'supply-chain-port',
    title: 'Port Congestion Crisis',
    domain: 'Supply Chain',
    icon: '🚢',
    content: `Karachi Port Trust (KPT) reports that container dwell time has increased to an average of 12 days, up from the normal 4-5 days, due to a combination of labor disputes and IT system failures in the automated gate system. Approximately 8,500 containers are currently backlogged.

The Pakistan International Freight Forwarders Association estimates that importers are facing demurrage charges of Rs. 15,000-25,000 per container per day, with total industry losses approaching Rs. 2.8 billion over the past two weeks.

Textile exporters, who account for 60% of Pakistan's exports, report that shipment delays are causing them to miss delivery windows with European buyers, risking contract penalties of 5-8% of order value. Three major European retailers — H&M, Primark, and Next — have issued formal delay notices to their Pakistani suppliers.

Port Qasim, operating at 85% capacity, has offered to absorb overflow traffic but lacks the specialized equipment for handling refrigerated containers, affecting pharmaceutical and food imports worth an estimated $120M currently in transit.`,
  },
  {
    id: 'sales-decline',
    title: 'Regional Sales Decline',
    domain: 'Business Operations',
    icon: '📉',
    content: `Q3 regional sales report for FastMart (leading FMCG distributor):

Lahore Zone: Orders declined by 25% compared to Q2, dropping from Rs. 180M to Rs. 135M. The decline is concentrated in the South Lahore territory where 3 of 5 major distributors have reported cashflow problems. Customer visit frequency by sales team dropped from 4x/month to 2x/month due to vehicle shortages.

Karachi Zone: Flat growth (+1.2%) but mix shifting toward lower-margin products. Premium SKU penetration fell from 34% to 22%.

Islamabad Zone: Strong growth (+18%) driven by new modern trade partnerships with Imtiaz Super Market and Metro Cash & Carry, adding 45 new outlets.

Overall: Company-wide gross margin compressed from 24% to 19.5% due to rising input costs not yet passed to consumers. Inventory days increased to 38 (target: 25). Top competitor MegaMart reportedly offering 8% trade discounts to capture share.

HR reports 12% field sales attrition in Lahore, with exit interviews citing compensation below market rate.`,
  },
];
