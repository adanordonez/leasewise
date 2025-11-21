# New Letter Templates Implementation

## Overview
Added **FOUR** new letter templates to the Letter Generator feature, following the same workflow as the Security Deposit Return letter.

## New Letter Types

### 1. Late Rent Payment Request
**Purpose:** Request additional time to pay rent with a proposed payment date

**User Inputs:**
- Landlord Name (required, auto-extracted)
- Landlord Address (optional, auto-extracted)
- Payment Date (required) - When tenant can make full payment
- Partial Payment Amount (optional) - Amount tenant can pay on original due date
- Additional Details (optional)

**RAG Queries:**
- Rent payment due date and terms
- Late fees and payment penalties
- Grace period for rent payment
- Payment schedule and procedures

**Letter Characteristics:**
- Respectful and apologetic tone
- Emphasizes temporary nature of situation
- Shows commitment to fulfilling obligation
- Offers solution with specific payment date
- Maintains positive landlord-tenant relationship

---

### 2. Repair Request
**Purpose:** Formally request repairs for issues in the rental unit

**User Inputs:**
- Landlord Name (required, auto-extracted)
- Landlord Address (optional, auto-extracted)
- Repair Issues (required, minimum 1) - List of specific problems
  - Can add multiple issues dynamically
  - Each issue described separately
- Additional Details (optional)

**RAG Queries:**
- Repair and maintenance responsibilities
- Maintenance request procedures
- Landlord obligations for repairs
- Habitability and property condition requirements

**Letter Characteristics:**
- Professional and polite but firm
- Clearly documents each issue
- References lease repair terms when available
- Emphasizes safety/comfort/habitability impact
- Requests prompt action and confirmation
- Creates formal paper trail

---

### 3. Emergency Repair Request
**Purpose:** Report urgent safety issues that require immediate attention

**User Inputs:**
- Landlord Name (required, auto-extracted)
- Landlord Address (optional, auto-extracted)
- Emergency Issue Description (required) - Detailed description of urgent problem
- Additional Details (optional)

**RAG Queries:**
- Emergency repairs and urgent maintenance
- Landlord emergency contact information
- Habitability and safety requirements
- Immediate repair obligations

**Letter Characteristics:**
- URGENT and EMERGENCY emphasis
- Professional but conveys serious urgency
- Emphasizes safety risks and habitability impact
- Requests immediate action and confirmation
- Available for access at ANY TIME
- Creates documentation of emergency situation

---

### 4. Notice of Lease Non-Renewal
**Purpose:** Formally notify landlord that tenant will not renew lease

**User Inputs:**
- Landlord Name (required, auto-extracted)
- Landlord Address (optional, auto-extracted)
- Move-Out Date (optional) - Defaults to lease end date if not provided
- Additional Details (optional)

**RAG Queries:**
- Lease termination and notice requirements
- Move-out procedures and inspection
- Security deposit return process
- Notice period for non-renewal

**Letter Characteristics:**
- Professional and courteous tone
- Clear statement of non-renewal intent
- References lease end date and notice requirements
- Requests move-out procedure information
- Requests security deposit return process
- Expresses appreciation for tenancy
- Does NOT provide reasons for leaving
- Maintains positive relationship

---

## Technical Implementation

### Frontend (`components/LegalLetters.tsx`)
- Added all four letter types to `LetterType` union type: `lateRent`, `repairRequest`, `emergencyRepair`, `leaseNonRenewal`
- Added state variables:
  - `paymentDate` and `partialPaymentAmount` for Late Rent
  - `repairIssues` array for Repair Request
  - `emergencyIssue` for Emergency Repair
  - `moveOutDate` for Lease Non-Renewal
- Added conditional form sections for each letter type
- Added validation for letter-specific required fields
- Updated `handleGenerate` to send new fields to API
- Updated `handleReset` to clear new fields
- Added UI cards for each new letter type with distinct colors:
  - Amber for Late Rent
  - Green for Repair Request
  - Red for Emergency Repair (emphasizes urgency)
  - Purple for Lease Non-Renewal

### Backend (`app/api/generate-legal-letter/route.ts`)
- Added new parameters to POST handler
- Created `generateLateRentLetter()` function:
  - Queries RAG for rent payment terms
  - Formats payment date nicely
  - Generates respectful, solution-focused letter
  - Includes partial payment offer if provided
- Created `generateRepairRequestLetter()` function:
  - Queries RAG for repair/maintenance terms
  - Formats multiple repair issues as numbered list
  - Generates professional documentation letter
  - Emphasizes safety and habitability
- Created `generateEmergencyRepairLetter()` function:
  - Queries RAG for emergency repair requirements
  - Emphasizes URGENT/EMERGENCY nature
  - Conveys safety risks clearly
  - Requests immediate action and confirmation
  - Professional but urgent tone
- Created `generateLeaseNonRenewalLetter()` function:
  - Queries RAG for termination and notice requirements
  - Uses lease end date from analysis
  - Requests move-out procedures
  - Requests security deposit return info
  - Courteous and appreciative tone
- Updated routing logic to call appropriate generator for all five letter types

### Translations (`messages/en.json` & `messages/es.json`)
- Added letter type names and descriptions
- Added form field labels and help text
- Fully bilingual support (English and Spanish)

---

## How It Works (Same Workflow as Security Deposit)

1. **User selects letter type** → Shows in UI with description
2. **Auto-extraction** → Fetches landlord info from lease using RAG
3. **User fills form** → Letter-specific fields + common fields
4. **Generation** → 
   - Rebuilds RAG from stored chunks
   - Queries lease for relevant clauses
   - Sends to GPT-4o with tailored prompt
   - Returns formatted business letter
5. **Preview & Edit** → User can edit, copy, or download as PDF

---

## Key Design Principles

### Lease-First Approach
- Only references what's in the lease itself
- Does NOT cite external laws unless in lease
- Avoids legal advice or threatening language
- Keeps it professional and relationship-focused

### Template Nature
- These are starting points for tenants
- Designed to be edited and customized
- Include disclaimer about legal advice
- Encourage tenant review before sending

### RAG Integration
- Uses semantic search to find relevant clauses
- Includes context from actual lease terms
- Falls back gracefully if no relevant clauses found
- Same embedding system as other features

---

## Testing Recommendations

### Late Rent Letter
1. Select "Late Rent Payment Request"
2. Verify landlord info auto-extracts
3. Select a future payment date
4. (Optional) Add partial payment amount
5. Generate and verify:
   - Respectful, apologetic tone
   - Clear payment date stated
   - Partial payment mentioned if provided
   - Professional closing

### Repair Request Letter
1. Select "Repair Request"
2. Verify landlord info auto-extracts
3. Add 2-3 repair issues
4. Click "+ Add Another Issue" to test dynamic fields
5. Generate and verify:
   - All issues listed clearly
   - Professional but firm tone
   - Safety/habitability emphasis
   - Contact info and availability offered

### Emergency Repair Letter
1. Select "Emergency Repair Request"
2. Verify landlord info auto-extracts
3. Describe an urgent issue (e.g., "Major water leak flooding kitchen, water coming through ceiling into living room")
4. Generate and verify:
   - URGENT/EMERGENCY emphasis in opening
   - Safety risk clearly stated
   - Request for immediate attention
   - Available at ANY TIME for access
   - Professional but urgent tone

### Lease Non-Renewal Letter
1. Select "Notice of Lease Non-Renewal"
2. Verify landlord info auto-extracts
3. (Optional) Specify move-out date if different from lease end
4. Generate and verify:
   - Clear statement of non-renewal intent
   - Lease end date referenced
   - Request for move-out procedures
   - Request for security deposit return info
   - Courteous and appreciative tone
   - No reasons given for leaving

---

## Letter Type Summary

| Letter Type | Color | Urgency | Key Focus |
|------------|-------|---------|-----------|
| Security Deposit Return | Blue | Normal | Getting deposit back |
| Late Rent Payment | Amber | Normal | Requesting time to pay |
| Repair Request | Green | Normal | Documenting repairs needed |
| Emergency Repair | Red | URGENT | Safety/habitability emergency |
| Lease Non-Renewal | Purple | Normal | Professional lease exit |

---

## Future Enhancement Ideas
- Add more letter types (lease renewal request, noise complaints, lease violation notice, etc.)
- Multi-language generation (not just UI, but actual letter content in Spanish)
- Save letter history for user reference
- Email sending integration
- Signature field support
- Certified mail tracking information
- Letter effectiveness tips per type

---

## Files Modified
- `components/LegalLetters.tsx` - UI component with new letter options
- `app/api/generate-legal-letter/route.ts` - Generator functions
- `messages/en.json` - English translations
- `messages/es.json` - Spanish translations

## Files Created
- This documentation file

---

**Status:** ✅ Complete and ready to use (All 5 letter types implemented)
**Date:** November 20, 2025
**Total Letter Templates:** 5 (Security Deposit + 4 new ones)

