# SearchPV Metrics

## Active Listings

Count of listings with active status in the selected inventory snapshot.

## Pending Listings

Count of listings with pending status in the selected inventory snapshot. Pending in this
context means that there is an accepted contract AND there is a security deposit in an escrow account.

## Closed Sales

Count of closed sales whose sold date falls within the selected date range.

## Median Sold Price

Median `sold_price_usd` for qualifying closed sales.

## Median Days on Market

Median listing DOM for qualifying closed sales.

DOM applies to the specific listing, not necessarily to the property's complete
marketing history.

## Sold-to-List Percentage

Formula:

sold_price_usd / final_list_price_usd * 100

Example:

- Final list price: $500,000
- Sold price: $475,000
- Sold-to-list: 95%
- Sold versus list: -5%

## Months of Inventory

Preferred formula:

current active inventory /
average monthly closed sales over the defined historical period

A capability must specify the sales period used in the denominator.

Months of inventory should not be calculated when the denominator is zero.
Return null and explain that there were no qualifying sales.

## Price per Square Meter

sold_price_usd / construction_m2

Records with missing or nonpositive construction area are excluded.

## Price per Square Foot

sold_price_usd / construction_ft2

Records with missing or nonpositive construction area are excluded.