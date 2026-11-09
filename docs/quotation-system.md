# Quotation and payment operations

This guide documents the itemised quotation workflow in the AQREVO admin dashboard. AQREVO is the owner-approved public brand; formal trademark and CAC clearance remain separate outstanding checks.

## Where to find it

1. Sign in at `/admin` using the authorised administrator account.
2. Open **Services & quotations**.
3. Use the three workspace tabs: **Service catalogue**, **Create quotation**, and **Quotation records**.

## Service catalogue

Each service record stores:
- Name, category and slug.
- Client-facing description.
- Optional starting price and pricing unit.
- Minimum and maximum delivery estimate.
- Included deliverables.
- Included revision rounds.
- Optional add-ons as a JSON array.
- Active status, public visibility and display order.

Only active services marked public are shown on the public website. The public website groups them by department and does not publish the internal starting prices. If a service is deactivated or made private, it is removed from the public service listing.

### Add-on format

Use a JSON array, for example:

```json
[
  { "name": "Rush delivery", "price": 2000 },
  { "name": "Additional revision round", "price": 1500 }
]
```

Use `[]` if there are no add-ons. Prices are NGN.

## Create a quotation

1. Optionally choose an existing enquiry to prefill the client's details and brief.
2. Confirm the client name, email and WhatsApp number.
3. Give the project a clear title and describe the brief.
4. Add one or more catalogue services, or enter custom line items.
5. Set quantity and unit price for every line.
6. Apply a discount only when approved.
7. Set the initial payment percentage (50% by default).
8. Set the timeline, validity date, included revision rounds and terms.
9. Save the quotation as a draft.

The system calculates:

- Line total = quantity × unit price.
- Subtotal = sum of line totals.
- Project total = subtotal − discount.
- Initial payment = project total × deposit percentage.
- Remaining amount before recorded payments = project total − initial payment.

A saved draft is internal only. It is not sent automatically.

## Send and track

From Quotation records:
- Use **Print / Save PDF** to produce a printable quotation.
- Use the WhatsApp link to prepare a message for the client.
- Use the email link to prepare an email in the user's email app.
- Mark a quotation **Sent** only after it has actually been sent.
- Mark a quotation **Accepted** only after the client has explicitly agreed.
- Update the status if the client declines, the quote expires or the project is cancelled.

The current workflow is manual handoff. No automatic email sending, payment collection or client acceptance portal is connected.

## Payment recording

1. Open the quotation.
2. Enter the payment amount, method, reference and date.
3. Save it as **Pending**.
4. Verify the actual funds in the receiving account.
5. Only then mark the record **Verified**.

Only verified payments reduce the outstanding balance. Pending payments do not. The UI blocks verification that would push the verified amount above the quotation total.

Never store card numbers, PINs, passwords or banking login details. A payment screenshot is not proof that funds have cleared.

## Data and access

The database stores:
- `service_catalogue`
- `quotations`
- `quotation_items`
- `payments`
- `project_updates`

Every table has Row Level Security enabled. Visitors may read only active, public service catalogue entries. Quotation, line-item, payment and project-update records are admin-only.

The quotation line items store a snapshot of the service name, description, quantity and unit price. Editing a service later does not rewrite historical quotations. Deleting a service preserves the quotation line item and clears only its optional service reference.

## Backwards compatibility

The existing `enquiries.quote_amount`, `quote_scope`, `quote_valid_until` and `quote_status` fields remain in place. Older enquiries and the earlier single-amount quotation workflow are not deleted. New itemised quotations are stored in the separate quotation tables.

## Not included yet

- Client login and self-service quote acceptance.
- Automatic invoice or receipt emailing.
- Payment gateway integration.
- Automatic reminders for overdue balances.
- Client-visible project timeline and deliverable downloads.

These should be added only after a secure client identity model, data ownership rules and the actual operating need are confirmed.
