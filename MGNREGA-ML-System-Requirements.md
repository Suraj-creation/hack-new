# MGNREGA ML/DL System Requirements
## End-to-End Specification for Fair, Explainable Work Allocation

---

## 1. EXECUTIVE SUMMARY

This document outlines the comprehensive requirements for building an ML/DL-powered MGNREGA work allocation system integrated with Conversational AI. The system prioritizes fairness, transparency, fraud detection, and empathetic decision-making with full explainability.

---

## 2. DATA COLLECTION REQUIREMENTS

### 2.1 Personal & Demographic Information

#### Core Identity Data
- **Aadhaar Number** (primary key, encrypted)
- **Job Card Number** (MGNREGA unique ID)
- **Full Name** (local language + transliteration)
- **Age & Date of Birth**
- **Gender** (Male/Female/Other)
- **Caste Category** (SC/ST/OBC/General)
- **Disability Status** (Yes/No + type if applicable)
- **Marital Status**
- **Education Level** (Illiterate/Primary/Secondary/Higher)

#### Contact Information
- **Mobile Number** (primary + alternate)
- **Residential Address** (Village/Ward, GP, Block, District)
- **GPS Coordinates** (home location)
- **Preferred Communication Language**

### 2.2 Family & Household Information

#### Household Composition
- **Total Family Members**
- **Number of Dependents** (children, elderly, disabled)
- **Number of Earning Members**
- **Single Parent Status** (Yes/No)
- **Elderly Care Responsibility** (caring for 60+ years)
- **Pregnant/Lactating Women in Household**
- **Children Under 5 Years** (count)
- **School-Going Children** (count + attendance status)

#### Socioeconomic Indicators
- **BPL/APL Status**
- **Ration Card Type** (Antyodaya/Priority/Non-priority)
- **Land Ownership** (landless/marginal/small/medium)
- **Livestock Ownership** (count + type)
- **Housing Type** (kuccha/puccha/semi-puccha)
- **Access to Toilet** (Yes/No)
- **Access to Drinking Water** (distance in meters)
- **Electricity Connection** (Yes/No)

#### Financial Status
- **Bank Account Number** (for wage payment)
- **Outstanding Debt** (amount + source)
- **Monthly Household Income** (estimated)
- **Other Government Scheme Benefits** (PM-KISAN, pension, etc.)

### 2.3 Work History & Availability

#### Historical Work Data
- **Total Days Worked** (current financial year)
- **Total Days Worked** (previous 3 years - trend analysis)
- **Work Start Dates** (array of all work periods)
- **Work End Dates** (array of all work periods)
- **Work Types Performed** (skill mapping)
- **Work Sites Attended** (location history)
- **Wages Received** (amount + payment delay days)
- **Wage Payment Delays** (historical pattern)
- **Work Quality Ratings** (from supervisors)
- **Attendance Regularity** (% days present when allocated)

#### Current Status
- **Days Since Last Work** (critical urgency indicator)
- **Consecutive Days Without Work** (hardship measure)
- **Days Worked This Year** (against 100-day guarantee)
- **Remaining Entitlement** (100 - days_worked)
- **Current Work Demand Status** (Applied/Waiting/Allocated/Working)
- **Work Demand Date** (when user requested work)
- **Wait Time Since Demand** (days waiting)

#### Availability & Constraints
- **Available Start Date** (when can join)
- **Preferred Work Sites** (proximity ranking)
- **Maximum Commute Distance** (in km)
- **Health Status** (fit/temporarily unfit/restricted work)
- **Current Employment Status** (any other work)
- **Seasonal Migration Status** (migrated/planning to migrate)
- **Agricultural Season Constraints** (sowing/harvesting periods)

### 2.4 Vulnerability & Priority Indicators

#### Health & Medical
- **Chronic Illness in Family** (TB/Cancer/Kidney/Heart/etc.)
- **Medical Emergency Status** (recent/ongoing)
- **Health Expenses** (monthly average)
- **Disability in Family** (type + severity)
- **Malnutrition Status** (based on health records)

#### Social Vulnerabilities
- **Widow/Widower Status**
- **Abandoned/Deserted Spouse**
- **Victim of Domestic Violence** (recorded/suspected)
- **Recent Death in Family** (within 6 months)
- **Recent Calamity Impact** (flood/drought/fire)
- **Eviction/Land Dispute Status**
- **Social Exclusion Indicators** (manual scavenging history, etc.)

#### Economic Distress
- **Food Insecurity Score** (days without adequate food/month)
- **Child School Dropout Risk** (due to financial distress)
- **Loan Default Status** (from informal sources)
- **Asset Sale for Survival** (sold livestock/jewelry recently)
- **Migration Due to Distress** (family member migrated for work)

#### Environmental Vulnerabilities
- **Drought-Affected Village** (severity score)
- **Flood-Affected Area** (recent impact)
- **Crop Failure** (recent seasons)
- **Climate Vulnerability Index** (region-specific)

### 2.5 Skill & Capability Data

- **Physical Fitness Level** (Heavy/Moderate/Light work capability)
- **Skills Acquired** (masonry/plumbing/plantation/etc.)
- **Training Completed** (MGNREGA skill development)
- **Literacy Level** (can read/write in any language)
- **Technical Skills** (phone usage/digital literacy)
- **Language Proficiency** (for instructions)
- **Previous Work Experience** (outside MGNREGA)
- **Willingness for Skill Training** (Yes/No)

### 2.6 Behavioral & Engagement Data

#### Positive Indicators
- **Work Completion Rate** (% of assigned work completed)
- **Quality of Work Score** (from supervisors)
- **Attendance Punctuality** (on-time arrival %)
- **Safety Compliance** (incidents/violations)
- **Community Participation** (in gram sabha/meetings)
- **Grievance Resolution Cooperation** (rating)

#### Red Flags for Fraud Detection
- **Duplicate Job Card Attempts** (flagged instances)
- **Ghost Worker Indicators** (rare attendance, proxy attempts)
- **Wage Withdrawal Patterns** (unusual timing/location)
- **Multiple Bank Accounts** (attempts to change frequently)
- **Collusion Indicators** (same bank account for multiple workers)
- **Biometric Mismatch History** (failed authentications)
- **Complaint History** (filed against or by worker)
- **Suspended Previously** (Yes/No + reason)

### 2.7 Geospatial & Contextual Data

- **Distance to Available Work Sites** (real-time calculation)
- **Transport Availability** (public/private/own)
- **Road Connectivity** (paved/unpaved/seasonal)
- **Work Site Suitability** (for user's physical capability)
- **Weather Conditions** (current + forecast - affects outdoor work)
- **Seasonal Work Demand** (agricultural calendar)
- **Local Employment Opportunities** (harvest season, construction boom)
- **Migration Patterns in Village** (community trend)

### 2.8 Conversational AI Interaction Data

#### Real-Time Extraction
- **Current Situation Description** (free text from conversation)
- **Urgency Level** (self-reported + AI-inferred)
- **Specific Needs** (food/medicine/child education/debt repayment)
- **Emotional State** (desperation/calm/angry - sentiment analysis)
- **Family Crisis Details** (medical emergency/death/marriage expense)
- **Recent Life Events** (job loss/crop failure/illness)
- **Barriers to Work** (childcare issues/health/transport)
- **Preference Changes** (willing to travel further if urgent)
- **Complaints or Grievances** (against officials/system)

#### Conversational Patterns
- **Frequency of Inquiry** (how often checking for work)
- **Communication Style** (assertive/hesitant/confused)
- **Information Provided** (complete/incomplete/contradictory)
- **Follow-up Behavior** (persistent/drops off)
- **Language Complexity** (education level inference)

---

## 3. ML/DL MODEL ARCHITECTURE

### 3.1 Multi-Model Ensemble System

#### Model 1: Priority Scoring Model
**Type:** Gradient Boosting (XGBoost/LightGBM) + Neural Network Ensemble

**Input Features (with weights):**

**Tier 1: Critical Urgency (40% weight)**
- Days since last work (20%)
- Food insecurity score (10%)
- Medical emergency status (5%)
- Dependent count / earning member ratio (5%)

**Tier 2: Vulnerability Index (30% weight)**
- BPL status (5%)
- Disability status (5%)
- Single parent/widow status (5%)
- Chronic illness in family (5%)
- Recent calamity impact (5%)
- Social exclusion indicators (5%)

**Tier 3: Entitlement & Fairness (20% weight)**
- Remaining work days (100 - days_worked) (10%)
- Wait time since demand (5%)
- Historical allocation gaps (5%)

**Tier 4: Capability & Suitability (10% weight)**
- Physical fitness match (3%)
- Skill match for available work (3%)
- Proximity to work site (2%)
- Attendance history (2%)

**Output:** Priority Score (0-100)

#### Model 2: Fraud Detection Model
**Type:** Anomaly Detection (Isolation Forest) + Deep Learning (Autoencoder)

**Features:**
- Attendance patterns (irregularity detection)
- Wage withdrawal patterns (time/location anomalies)
- Biometric authentication failures
- Multiple bank account changes
- Ghost worker indicators (rare physical presence)
- Collusion networks (graph neural network for relationship detection)
- Duplicate identity attempts
- Work-wage mismatch patterns

**Output:** Fraud Risk Score (0-100) + Fraud Type Classification

#### Model 3: Fair Allocation Optimizer
**Type:** Constrained Optimization with Fairness Constraints

**Objectives:**
- Maximize priority-weighted allocation
- Minimize inequality (Gini coefficient across groups)
- Ensure caste/gender balance (proportional representation)
- Optimize work site capacity utilization
- Minimize travel distance (aggregate)

**Constraints:**
- Each worker ≤ 100 days/year
- Work site capacity limits
- Skill requirements met
- Minimum gender ratio per site (≥33% women)
- No discrimination (audit for disparate impact)

**Output:** Allocation Matrix (Worker × Work Site × Days)

#### Model 4: Empathetic Context Understanding (NLP)
**Type:** Transformer-based Language Model (fine-tuned BERT/GPT)

**Inputs:**
- Conversational AI transcripts
- Free-text situation descriptions
- Historical grievance texts
- Community reports

**Tasks:**
- Sentiment analysis (distress level)
- Named entity recognition (family members, diseases, expenses)
- Intent classification (urgent need/routine inquiry/complaint)
- Empathy scoring (how much support needed)

**Output:** Context Embeddings + Urgency Flags + Key Phrases

#### Model 5: Predictive Analytics
**Type:** Time Series Forecasting (LSTM/Prophet)

**Predictions:**
- Worker dropout risk (likely to migrate)
- Seasonal demand patterns
- Wage payment delay predictions
- Work completion probability
- Future vulnerability trajectory

**Output:** Risk Scores + Recommended Interventions

### 3.2 Feature Engineering

#### Derived Features
- **Work Gap Severity:** `days_since_last_work / average_gap_in_village`
- **Desperation Index:** `(debt/income) × (dependents/earners) × days_without_work`
- **Entitlement Utilization:** `days_worked / days_demanded`
- **Vulnerability Composite:** Weighted sum of health, social, economic factors
- **Fairness Penalty:** Historical allocation bias correction term
- **Seasonal Adjustment:** Agricultural calendar impact on availability
- **Community Baseline:** Deviation from village average indicators

#### Interaction Features
- `disability × physical_work_type` (capability mismatch)
- `distance × transport_availability` (accessibility barrier)
- `urgency × available_capacity` (demand-supply tension)
- `caste × historical_allocation` (discrimination detection)
- `gender × work_type` (preference/suitability)

### 3.3 Training & Validation

#### Training Data
- Historical allocation data (3-5 years)
- Work completion outcomes
- Grievance records (as negative feedback)
- Audit findings (fraud cases)
- Wage payment delays
- Worker feedback surveys

#### Validation Strategy
- **Fairness Validation:** Test for disparate impact across protected groups
- **Temporal Validation:** Train on past data, test on recent data
- **Geographic Validation:** Test model trained in one region on another
- **Counterfactual Testing:** "What if" scenarios for edge cases

#### Metrics
- **Priority Accuracy:** Correlation between predicted priority and actual need
- **Fraud Detection:** Precision/Recall (minimize false positives)
- **Allocation Fairness:** Gini coefficient, demographic parity
- **System Efficiency:** Work completion rate, wage payment timeliness
- **User Satisfaction:** Survey scores, grievance reduction

---

## 4. EXPLAINABILITY FRAMEWORK

### 4.1 Explainability Requirements

Every decision must be explainable at three levels:

#### Level 1: Individual Explanation
**"Why was Worker X given priority?"**

**Template:**
```
Worker [Name] was allocated work based on:

PRIMARY REASONS (contributing 70% to decision):
1. Has not worked for [N] days - CRITICAL urgency (30% weight)
2. Family has [N] dependents including [details] (20% weight)
3. Food insecurity score [X/10] - high distress (20% weight)

SECONDARY REASONS (contributing 30%):
4. BPL status with [details] (10% weight)
5. Recent medical emergency: [details] (10% weight)
6. Has [N] days remaining in 100-day entitlement (10% weight)

SUITABILITY FACTORS:
- Lives [X] km from work site (within acceptable range)
- Physical capability: Suitable for [work type]
- Attendance history: [X]% regular (good)

FAIRNESS CONSIDERATIONS:
- Belongs to [SC/ST/OBC/General] - proportional allocation maintained
- Gender: [Male/Female] - balanced allocation ensured
- No discrimination detected in allocation pattern
```

#### Level 2: Comparative Explanation
**"Why was Worker X prioritized over Worker Y?"**

**Template:**
```
COMPARISON: [Worker X] vs [Worker Y]

Worker X was prioritized because:

URGENCY FACTORS:
- X: [N] days without work | Y: [M] days without work → X more urgent
- X: Food insecurity [score] | Y: [score] → X higher distress
- X: Medical emergency | Y: No emergency → X critical need

VULNERABILITY FACTORS:
- X: [vulnerability details] | Y: [details] → X more vulnerable

ENTITLEMENT FACTORS:
- X: [N] days used | Y: [M] days used → X has more entitlement remaining

FAIRNESS CHECK:
- Both compared against same criteria
- No discrimination detected
- Allocation maintains group balance
```

#### Level 3: System-Wide Explanation
**"How was today's allocation decided?"**

**Template:**
```
ALLOCATION SUMMARY - [Date]

TOTAL DEMAND: [N] workers requested work
TOTAL CAPACITY: [M] positions available at [X] work sites

ALLOCATION METHODOLOGY:
1. Priority scoring based on urgency, vulnerability, entitlement
2. Fraud screening (eliminated [N] suspicious cases)
3. Fair optimization with constraints:
   - Caste balance: [current distribution]
   - Gender balance: [current distribution]
   - Distance optimization: Average [X] km
4. Skill-work matching
5. Final allocation: [M] workers allocated

FAIRNESS METRICS:
- Gini coefficient: [value] (target < 0.3)
- Gender parity: [X]% women (target ≥33%)
- Caste representation: Proportional to population
- Average wait time: [N] days

UNMET DEMAND:
- [N] workers waitlisted (reason: capacity constraint)
- Next allocation: [date]
- High-priority cases escalated: [count]
```

### 4.2 SHAP (SHapley Additive exPlanations) Integration

For each allocation decision, compute SHAP values:

**Example Output:**
```
Feature                          | SHAP Value | Impact
---------------------------------|------------|--------
Days since last work (45 days)   | +15.2      | HIGH ↑
Dependents (5 members)           | +8.3       | MEDIUM ↑
BPL status (Antyodaya)          | +6.1       | MEDIUM ↑
Medical emergency (active)       | +5.8       | MEDIUM ↑
Food insecurity score (8/10)     | +4.9       | MEDIUM ↑
Distance to site (2 km)          | +2.1       | LOW ↑
Attendance history (85%)         | +1.4       | LOW ↑
Age (42 years)                   | -0.3       | NEGLIGIBLE
Education (Primary)              | -0.1       | NEGLIGIBLE
```

### 4.3 Counterfactual Explanations

**"What would need to change for Worker Y to get priority?"**

**Template:**
```
For Worker [Y] to receive priority allocation:

OPTION 1: If urgency increases
- If days without work increase from [current] to [threshold] days
- Impact: Priority score would increase by [X] points

OPTION 2: If vulnerability factors change
- If family has [condition], priority would increase
- Impact: Priority score would increase by [Y] points

OPTION 3: If entitlement changes
- If worker uses fewer days this year, priority would adjust
- Current: [N] days used | Threshold: [M] days

CURRENT STATUS: Worker Y is [rank] in queue
ESTIMATED WAIT: [N] days until next allocation opportunity
```

### 4.4 Bias & Fairness Auditing

**Automated Checks:**
```
FAIRNESS AUDIT REPORT - [Date]

1. GENDER FAIRNESS
   - Allocation rate (Male): [X]%
   - Allocation rate (Female): [Y]%
   - Parity score: [Z] (target: 1.0 ± 0.1)
   - Status: [PASS/FAIL]

2. CASTE FAIRNESS
   - SC allocation: [X]% (population: [Y]%) - Ratio: [Z]
   - ST allocation: [X]% (population: [Y]%) - Ratio: [Z]
   - OBC allocation: [X]% (population: [Y]%) - Ratio: [Z]
   - General allocation: [X]% (population: [Y]%) - Ratio: [Z]
   - Status: [PASS/FAIL]

3. DISABILITY INCLUSION
   - Workers with disability: [X]%
   - Allocation rate: [Y]%
   - Status: [PASS/FAIL]

4. AGE FAIRNESS
   - Age group 18-30: [X]% allocation
   - Age group 31-45: [Y]% allocation
   - Age group 46-60: [Z]% allocation
   - Status: [PASS/FAIL]

5. GEOGRAPHIC FAIRNESS
   - [Village A]: [X]% allocation (demand: [Y]%)
   - [Village B]: [X]% allocation (demand: [Y]%)
   - Variance: [Z] (target: < 0.2)
   - Status: [PASS/FAIL]

OVERALL FAIRNESS SCORE: [X]/100
ISSUES DETECTED: [List any disparities]
CORRECTIVE ACTIONS: [Recommendations]
```

---

## 5. CONVERSATIONAL AI INTEGRATION

### 5.1 Information Extraction Flow

**Conversation Example:**

```
User: "Namaste, I need work urgently."

AI: "Namaste! I understand you need work. Let me help you. May I ask a few questions?
     What is your job card number?"

User: "JC/05/123/456789"

AI: [SYSTEM: Retrieve user profile, load context]
    "Thank you, [Name]. I see you last worked on [date], which was [N] days ago.
     Can you tell me about your current situation?"

User: "My child is sick, we have no money for medicine."

AI: [EXTRACT: medical_emergency = True, urgency_level = HIGH, 
     emotional_state = distressed]
    "I'm very sorry to hear that. What illness is your child facing?"

User: "High fever for 3 days, doctor said need tests."

AI: [EXTRACT: illness_type = fever, duration = 3 days, 
     medical_expense_pending = True]
    "I understand. How many family members depend on your income?"

User: "I have 3 children and my mother who is old."

AI: [EXTRACT: dependents = 4 (3 children + 1 elderly), 
     elderly_care = True]
    "Thank you for sharing. How many days of work do you need urgently?"

User: "At least 10-15 days, need money fast."

AI: [EXTRACT: urgent_work_days_needed = 10-15, 
     financial_emergency = True]

AI: [SYSTEM: Calculate priority score, check available work, 
     generate explanation]

    "Based on your situation, I am submitting a HIGH PRIORITY work request.
     
     YOUR PRIORITY SCORE: 87/100
     
     Reasons for priority:
     • Medical emergency (child's illness) - CRITICAL
     • 45 days since last work - HIGH urgency
     • 4 dependent family members - HIGH need
     • No other earning members - HIGH vulnerability
     
     AVAILABLE WORK:
     - Road construction at [Location A] - 3 km from your home
     - Pond deepening at [Location B] - 5 km from your home
     
     Which location do you prefer?"

User: "Location A is better, closer to home."

AI: [SYSTEM: Submit allocation request with preference]
    "Understood. I have marked your preference.
     
     NEXT STEPS:
     • Your application is in HIGH PRIORITY queue (Rank: 3)
     • Expected allocation: Within 2 days
     • You will receive SMS confirmation
     • Report to site on [date] at [time]
     
     IMMEDIATE SUPPORT:
     Since you have a medical emergency, you may be eligible for:
     • Unemployment allowance (if work not provided within 15 days)
     • Medical assistance under [health scheme]
     
     Would you like me to connect you with these services?"

User: "Yes, please."

AI: [SYSTEM: Initiate referral to health scheme, create follow-up]
    "I have created a referral. You will receive a call from [helpline]
     within 24 hours. 
     
     I have also set a reminder to check your allocation status tomorrow.
     Is there anything else I can help with?"
```

### 5.2 Data Extraction Logic

**Conversational AI Processing Pipeline:**

```
STAGE 1: USER INPUT
↓
STAGE 2: NLP PROCESSING
- Speech-to-text (if voice input)
- Language detection
- Sentiment analysis
- Entity extraction
↓
STAGE 3: CONTEXT RETRIEVAL
- Load user profile from database
- Retrieve work history
- Check pending applications
- Load vulnerability indicators
↓
STAGE 4: INFORMATION EXTRACTION
- Extract new information from conversation
- Identify urgency signals
- Detect distress indicators
- Map to database fields
↓
STAGE 5: DATABASE UPDATE
- Update real-time fields
- Flag urgent cases
- Log conversation metadata
↓
STAGE 6: ML MODEL INVOCATION
- Pass updated data to priority model
- Get priority score + explanation
- Check fraud detection
- Run fairness checks
↓
STAGE 7: RESPONSE GENERATION
- Generate empathetic response
- Provide explanation
- Suggest next steps
- Offer additional support
↓
STAGE 8: ACTION EXECUTION
- Submit allocation request
- Trigger notifications
- Create escalations if needed
- Schedule follow-ups
```

### 5.3 Real-Time Priority Adjustments

**Trigger-Based Re-Scoring:**

```
TRIGGER: User mentions medical emergency
→ ACTION: Boost priority score by +15 points
→ FLAG: medical_emergency = True
→ ESCALATE: If score > 85, alert supervisor

TRIGGER: Days without work > 60
→ ACTION: Boost priority score by +20 points
→ FLAG: critical_urgency = True
→ ESCALATE: Automatic allocation or unemployment allowance

TRIGGER: Food insecurity keywords ("hungry", "no food", "children not eating")
→ ACTION: Boost priority score by +18 points
→ FLAG: food_emergency = True
→ ESCALATE: Referral to PDS/food assistance

TRIGGER: Suicide risk indicators ("can't live like this", "no hope", "end it")
→ ACTION: Maximum priority score = 100
→ FLAG: mental_health_crisis = True
→ ESCALATE: Immediate human intervention + counseling referral

TRIGGER: Multiple follow-ups without allocation (>3 in 7 days)
→ ACTION: Boost priority score by +10 points
→ FLAG: system_failure_suspected = True
→ ESCALATE: Grievance redressal + manual review
```

---

## 6. FRAUD DETECTION & PREVENTION

### 6.1 Fraud Pattern Detection

#### Pattern 1: Ghost Workers
**Indicators:**
- Job card exists but rare/no physical attendance
- Biometric authentication fails repeatedly
- Wages withdrawn but no work recorded
- Same bank account for multiple workers

**Detection Logic:**
```python
if (attendance_rate < 0.3 AND biometric_failures > 5 AND wages_withdrawn > 0):
    fraud_score += 40
    fraud_type = "ghost_worker"
    
if (bank_account in multiple_job_cards AND same_geographic_area):
    fraud_score += 50
    fraud_type = "collusion_network"
```

#### Pattern 2: Duplicate Identity
**Indicators:**
- Multiple job cards with similar names
- Same biometric matches across different IDs
- Same mobile number for different workers
- Same address with different names

**Detection Logic:**
```python
if (name_similarity > 0.9 AND different_job_cards):
    fraud_score += 35
    
if (biometric_match AND different_aadhaar):
    fraud_score += 60
    fraud_type = "duplicate_identity"
```

#### Pattern 3: Proxy Attendance
**Indicators:**
- Biometric attendance at work site but no actual work output
- Attendance marked but supervisor reports absence
- Attendance timing patterns (always late/early)

**Detection Logic:**
```python
if (attendance_marked AND supervisor_report_absent):
    fraud_score += 45
    fraud_type = "proxy_attendance"
```

#### Pattern 4: Collusion (Officials + Workers)
**Indicators:**
- Same supervisor for all suspicious cases
- Inflated work measurements
- Rapid wage withdrawals post-allocation
- Network clustering in fraud detection graph

**Detection Logic:**
```python
if (suspicious_workers_group AND same_supervisor):
    fraud_score += 55
    fraud_type = "official_collusion"
    escalate_to_vigilance()
```

### 6.2 Fraud Prevention Mechanisms

**Real-Time Checks:**
1. **Biometric Verification:** Mandatory at work site
2. **Geo-Fencing:** Phone location must match work site during hours
3. **Supervisor Verification:** Random checks and cross-verification
4. **Photographic Evidence:** Random photos of workers at site
5. **Bank Account Monitoring:** Track withdrawal patterns
6. **Social Audit Integration:** Cross-check with community reports

**Automated Flags:**
```
LOW RISK (Score 0-30): Normal processing
MEDIUM RISK (Score 31-60): Additional verification required
HIGH RISK (Score 61-80): Supervisor approval + investigation
CRITICAL RISK (Score 81-100): Block allocation + immediate investigation
```

---

## 7. WEIGHTING & SCORING SYSTEM

### 7.1 Priority Score Calculation

**Base Formula:**
```
Priority Score = 
  (Urgency Score × 0.40) +
  (Vulnerability Score × 0.30) +
  (Entitlement Score × 0.20) +
  (Suitability Score × 0.10)
```

### 7.2 Detailed Scoring

#### Urgency Score (0-100, weight: 40%)

```python
urgency_score = 0

# Days without work (max 50 points)
if days_since_last_work > 60:
    urgency_score += 50
elif days_since_last_work > 45:
    urgency_score += 40
elif days_since_last_work > 30:
    urgency_score += 30
elif days_since_last_work > 15:
    urgency_score += 20
else:
    urgency_score += (days_since_last_work / 15) * 20

# Food insecurity (max 25 points)
urgency_score += food_insecurity_score * 2.5

# Medical emergency (max 15 points)
if medical_emergency:
    urgency_score += 15
elif chronic_illness_family:
    urgency_score += 10

# Dependent ratio (max 10 points)
dependent_ratio = dependents / max(earning_members, 1)
urgency_score += min(dependent_ratio * 2, 10)

urgency_score = min(urgency_score, 100)
```

#### Vulnerability Score (0-100, weight: 30%)

```python
vulnerability_score = 0

# Economic vulnerability (max 40 points)
if bpl_status == "Antyodaya":
    vulnerability_score += 25
elif bpl_status == "Priority":
    vulnerability_score += 15
    
if landless:
    vulnerability_score += 15
    
# Social vulnerability (max 30 points)
if widow or single_parent:
    vulnerability_score += 15
if disability_status:
    vulnerability_score += 15
if caste in ["SC", "ST"]:
    vulnerability_score += 5
if manual_scavenging_history:
    vulnerability_score += 20
    
# Health vulnerability (max 20 points)
if chronic_illness_family:
    vulnerability_score += 10
if elderly_care_responsibility:
    vulnerability_score += 5
if pregnant_lactating_women:
    vulnerability_score += 5

# Environmental vulnerability (max 10 points)
if drought_affected_village:
    vulnerability_score += 5
if recent_calamity:
    vulnerability_score += 5

vulnerability_score = min(vulnerability_score, 100)
```

#### Entitlement Score (0-100, weight: 20%)

```python
entitlement_score = 0

# Remaining days (max 60 points)
remaining_days = 100 - days_worked_this_year
entitlement_score += (remaining_days / 100) * 60

# Wait time since demand (max 30 points)
if wait_time_days > 15:
    entitlement_score += 30
elif wait_time_days > 10:
    entitlement_score += 20
elif wait_time_days > 5:
    entitlement_score += 10
else:
    entitlement_score += (wait_time_days / 5) * 10

# Historical allocation fairness (max 10 points)
# Correction for past under-allocation
if historical_allocation_rate < village_average:
    entitlement_score += 10

entitlement_score = min(entitlement_score, 100)
```

#### Suitability Score (0-100, weight: 10%)

```python
suitability_score = 0

# Physical capability match (max 30 points)
if physical_fitness_match(work_type):
    suitability_score += 30
elif partial_match(work_type):
    suitability_score += 15

# Skill match (max 25 points)
if skill_exact_match(work_type):
    suitability_score += 25
elif skill_trainable(work_type):
    suitability_score += 15

# Proximity (max 25 points)
if distance_to_site < 2:
    suitability_score += 25
elif distance_to_site < 5:
    suitability_score += 15
elif distance_to_site < 10:
    suitability_score += 5

# Attendance history (max 20 points)
if attendance_rate > 0.9:
    suitability_score += 20
elif attendance_rate > 0.75:
    suitability_score += 15
elif attendance_rate > 0.6:
    suitability_score += 10

suitability_score = min(suitability_score, 100)
```

### 7.3 Final Priority Calculation with Fairness Adjustment

```python
# Base priority
base_priority = (
    urgency_score * 0.40 +
    vulnerability_score * 0.30 +
    entitlement_score * 0.20 +
    suitability_score * 0.10
)

# Fairness adjustment
fairness_penalty = 0

# Check for historical discrimination
if historical_allocation_rate < expected_rate_for_group:
    fairness_boost = (expected_rate - historical_rate) * 100
    base_priority += fairness_boost

# Diversity bonus (if group underrepresented in current batch)
if gender == "Female" and female_allocation_today < 0.33:
    base_priority += 5
if caste in ["SC", "ST"] and caste_allocation_today < proportional_target:
    base_priority += 5

# Final priority score
final_priority = min(base_priority, 100)

# Fraud check
if fraud_score > 60:
    final_priority = 0  # Disqualify
    flag_for_investigation()
```

---

## 8. ACTIONABLE OUTPUT SPECIFICATION

### 8.1 Output to Conversational AI

**JSON Structure:**

```json
{
  "user_id": "JC/05/123/456789",
  "name": "Ramesh Kumar",
  "priority_score": 87,
  "priority_rank": 3,
  "allocation_status": "HIGH_PRIORITY",
  
  "urgency_analysis": {
    "urgency_score": 92,
    "primary_factors": [
      {
        "factor": "Days without work",
        "value": 45,
        "severity": "CRITICAL",
        "contribution": 30
      },
      {
        "factor": "Medical emergency",
        "value": "Child illness - high fever",
        "severity": "HIGH",
        "contribution": 15
      },
      {
        "factor": "Food insecurity",
        "value": 8,
        "severity": "HIGH",
        "contribution": 12
      }
    ],
    "urgency_level": "CRITICAL"
  },
  
  "vulnerability_analysis": {
    "vulnerability_score": 78,
    "key_vulnerabilities": [
      "BPL - Antyodaya card holder",
      "4 dependents (3 children + 1 elderly)",
      "Landless laborer",
      "Recent medical expense burden"
    ],
    "social_category": "SC",
    "disability_status": false
  },
  
  "entitlement_analysis": {
    "entitlement_score": 85,
    "days_worked_this_year": 23,
    "remaining_entitlement": 77,
    "wait_time_days": 12,
    "historical_allocation_rate": "Below average"
  },
  
  "work_recommendation": {
    "recommended_work_sites": [
      {
        "site_id": "WS/05/123/001",
        "site_name": "Road Construction - Village Link Road",
        "location": "Near Gram Panchayat Office",
        "distance_km": 3,
        "work_type": "Earthwork",
        "physical_suitability": "Suitable",
        "available_positions": 15,
        "start_date": "2026-02-01",
        "estimated_days": 30,
        "user_preference": 1
      },
      {
        "site_id": "WS/05/123/002",
        "site_name": "Pond Deepening - Community Pond",
        "location": "Near Primary School",
        "distance_km": 5,
        "work_type": "Earthwork",
        "physical_suitability": "Suitable",
        "available_positions": 10,
        "start_date": "2026-02-03",
        "estimated_days": 20,
        "user_preference": 2
      }
    ]
  },
  
  "allocation_decision": {
    "decision": "ALLOCATE",
    "allocation_site": "WS/05/123/001",
    "allocation_days": 15,
    "start_date": "2026-02-01",
    "reporting_time": "08:00 AM",
    "expected_wage": 4500,
    "confidence": 0.94
  },
  
  "explanation": {
    "summary": "High priority allocation recommended due to critical urgency (45 days without work) and medical emergency.",
    "detailed_reasons": [
      "CRITICAL: 45 days since last work - exceeds acceptable threshold",
      "HIGH: Active medical emergency (child illness requiring treatment)",
      "HIGH: Food insecurity score 8/10 indicating severe distress",
      "MEDIUM: 4 dependent family members with single earning member",
      "MEDIUM: BPL Antyodaya status indicating extreme poverty",
      "LOW: 12 days waiting since work demand - approaching limit"
    ],
    "fairness_statement": "Allocation maintains gender balance (worker is male, current batch 35% female). Caste representation proportional. No discrimination detected.",
    "comparison": "Worker ranks 3rd out of 47 applicants in priority queue."
  },
  
  "fraud_check": {
    "fraud_score": 12,
    "fraud_risk": "LOW",
    "verification_required": false,
    "checks_passed": [
      "Biometric authentication history clean",
      "Attendance pattern normal",
      "Bank account verified",
      "No duplicate identity flags",
      "No collusion indicators"
    ]
  },
  
  "additional_support": {
    "eligible_schemes": [
      {
        "scheme": "State Health Assistance",
        "benefit": "Medical expense reimbursement up to ₹5000",
        "action": "Referral initiated"
      },
      {
        "scheme": "MGNREGA Unemployment Allowance",
        "benefit": "Applicable if work not provided within 15 days",
        "status": "Monitoring (currently day 12)"
      }
    ],
    "escalations": [
      {
        "type": "Medical Emergency Alert",
        "sent_to": "Block Development Officer",
        "timestamp": "2026-01-30T10:35:00Z"
      }
    ]
  },
  
  "conversation_guidance": {
    "empathy_level": "HIGH",
    "tone": "Supportive and reassuring",
    "key_messages": [
      "Acknowledge medical emergency with empathy",
      "Provide clear timeline for work allocation",
      "Explain why priority was given",
      "Offer additional support options",
      "Set clear expectations for next steps"
    ],
    "follow_up": {
      "schedule": "2026-01-31T10:00:00Z",
      "purpose": "Confirm allocation and check situation"
    }
  },
  
  "alerts": {
    "critical_flags": [
      "MEDICAL_EMERGENCY",
      "FOOD_INSECURITY_HIGH"
    ],
    "recommended_actions": [
      "Expedite allocation within 48 hours",
      "Connect with health scheme",
      "Monitor for follow-up"
    ]
  }
}
```

### 8.2 Output to Dashboard/Admin Interface

**Allocation Batch Summary:**

```json
{
  "allocation_date": "2026-02-01",
  "batch_id": "BATCH/05/2026/001",
  
  "summary": {
    "total_applicants": 156,
    "total_allocated": 89,
    "total_waitlisted": 67,
    "total_work_sites": 12,
    "total_positions_available": 95,
    "utilization_rate": 0.937
  },
  
  "fairness_metrics": {
    "gender_distribution": {
      "male": {"allocated": 58, "percentage": 65.2},
      "female": {"allocated": 31, "percentage": 34.8},
      "target_female_percentage": 33.0,
      "status": "COMPLIANT"
    },
    "caste_distribution": {
      "SC": {"allocated": 22, "population_percentage": 24, "status": "PROPORTIONAL"},
      "ST": {"allocated": 15, "population_percentage": 18, "status": "PROPORTIONAL"},
      "OBC": {"allocated": 38, "population_percentage": 42, "status": "PROPORTIONAL"},
      "General": {"allocated": 14, "population_percentage": 16, "status": "PROPORTIONAL"}
    },
    "disability_inclusion": {
      "allocated": 7,
      "percentage": 7.9,
      "status": "GOOD"
    },
    "gini_coefficient": 0.24,
    "fairness_score": 92
  },
  
  "priority_distribution": {
    "critical": {"count": 12, "allocated": 12, "allocation_rate": 1.0},
    "high": {"count": 31, "allocated": 29, "allocation_rate": 0.935},
    "medium": {"count": 58, "allocated": 38, "allocation_rate": 0.655},
    "low": {"count": 55, "allocated": 10, "allocation_rate": 0.182}
  },
  
  "fraud_detection": {
    "total_screened": 156,
    "flagged_high_risk": 3,
    "flagged_medium_risk": 8,
    "blocked_allocation": 3,
    "under_investigation": 3
  },
  
  "alerts": {
    "critical_cases": 12,
    "medical_emergencies": 7,
    "food_insecurity_high": 15,
    "unemployment_allowance_due": 5
  },
  
  "top_priority_cases": [
    {
      "job_card": "JC/05/123/456789",
      "name": "Ramesh Kumar",
      "priority_score": 87,
      "reason": "Medical emergency + 45 days without work",
      "allocation_status": "ALLOCATED"
    }
    // ... more cases
  ]
}
```

---

## 9. TECHNICAL IMPLEMENTATION

### 9.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CONVERSATIONAL AI LAYER                    │
│  (Voice/Text Interface - Multi-language Support)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              NLP & CONTEXT UNDERSTANDING                     │
│  • Intent Classification                                     │
│  • Entity Extraction                                         │
│  • Sentiment Analysis                                        │
│  • Empathy Detection                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  DATA INGESTION & ENRICHMENT                 │
│  • Real-time Conversation Data                               │
│  • Historical Database Query                                 │
│  • External Data Sources (Weather, Market, Schemes)          │
│  • Feature Engineering                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    ML/DL MODEL ENSEMBLE                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Priority  │  │   Fraud    │  │ Fairness   │           │
│  │  Scoring   │  │ Detection  │  │ Optimizer  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐                            │
│  │ Empathetic │  │ Predictive │                            │
│  │  Context   │  │ Analytics  │                            │
│  └────────────┘  └────────────┘                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  EXPLAINABILITY ENGINE                       │
│  • SHAP Value Computation                                    │
│  • Explanation Template Generation                           │
│  • Counterfactual Analysis                                   │
│  • Fairness Audit Reports                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  DECISION & ACTION LAYER                     │
│  • Allocation Execution                                      │
│  • Notification Triggers                                     │
│  • Escalation Management                                     │
│  • Scheme Referrals                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              FEEDBACK & CONTINUOUS LEARNING                  │
│  • Outcome Tracking (work completion, satisfaction)          │
│  • Grievance Integration                                     │
│  • Model Retraining Pipeline                                 │
│  • A/B Testing for Fairness                                  │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Technology Stack Recommendations

**ML/DL Frameworks:**
- **Gradient Boosting:** XGBoost, LightGBM (priority scoring)
- **Deep Learning:** PyTorch/TensorFlow (NLP, fraud detection)
- **NLP:** Hugging Face Transformers (BERT/GPT fine-tuned for Indian languages)
- **Optimization:** OR-Tools, CVXPY (fair allocation optimizer)
- **Explainability:** SHAP, LIME, Captum

**Infrastructure:**
- **Database:** PostgreSQL (relational), MongoDB (conversation logs)
- **Real-time Processing:** Apache Kafka (event streaming)
- **Model Serving:** TensorFlow Serving, TorchServe
- **API Gateway:** FastAPI, Flask
- **Conversational AI:** Rasa, Dialogflow (with custom NLU)

**Monitoring & Auditing:**
- **Model Monitoring:** MLflow, Weights & Biases
- **Fairness Monitoring:** Fairlearn, AIF360
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)

### 9.3 Data Privacy & Security

**Privacy Requirements:**
- **Encryption:** AES-256 for data at rest, TLS 1.3 for data in transit
- **Anonymization:** PII masked in logs and analytics
- **Access Control:** Role-based access (RBAC)
- **Audit Trails:** All model decisions logged with timestamps
- **Consent Management:** User consent for data processing
- **Data Retention:** Compliance with data protection regulations

**Security Measures:**
- **Authentication:** Multi-factor authentication for admin access
- **Model Security:** Adversarial training to prevent manipulation
- **Input Validation:** Sanitize all user inputs
- **Rate Limiting:** Prevent system abuse
- **Intrusion Detection:** Monitor for fraud attempts

---

## 10. ETHICAL CONSIDERATIONS

### 10.1 Principles

1. **Non-Discrimination:** No bias based on caste, gender, religion, disability
2. **Transparency:** Every decision explainable to stakeholders
3. **Accountability:** Clear responsibility for model errors
4. **Human Oversight:** Critical decisions reviewed by humans
5. **Privacy:** Protect sensitive personal information
6. **Fairness:** Ensure equitable distribution of work opportunities
7. **Empathy:** System designed to understand and respond to human suffering
8. **Recourse:** Clear grievance mechanism for contested decisions

### 10.2 Bias Mitigation

**Pre-processing:**
- Balance training data across protected groups
- Remove proxy features for discrimination (e.g., caste-correlated location)

**In-processing:**
- Fairness constraints in optimization
- Adversarial debiasing during training

**Post-processing:**
- Threshold optimization per group to equalize outcomes
- Regular fairness audits

### 10.3 Human-in-the-Loop

**Manual Review Required:**
- Fraud scores > 80 (before blocking allocation)
- Priority scores at boundary (e.g., 48-52 near cutoff)
- Grievances filed against AI decision
- Vulnerable groups (suicide risk indicators)

**Escalation Triggers:**
- System detects potential discrimination
- Fraud network involving officials
- Allocation violates fairness thresholds
- User reports distress in conversation

---

## 11. EVALUATION & SUCCESS METRICS

### 11.1 Model Performance Metrics

**Priority Model:**
- **Accuracy:** Correlation between predicted and actual need (target: r > 0.85)
- **Ranking Quality:** NDCG@k for top-k priority list (target: > 0.90)
- **Calibration:** Priority scores match real-world outcomes

**Fraud Model:**
- **Precision:** % of flagged cases that are actual fraud (target: > 0.80)
- **Recall:** % of actual fraud cases caught (target: > 0.75)
- **F1-Score:** Balance of precision and recall (target: > 0.77)
- **False Positive Rate:** Minimize innocent workers flagged (target: < 0.05)

**Fairness Optimizer:**
- **Gini Coefficient:** Inequality in allocation (target: < 0.30)
- **Demographic Parity:** Equal allocation rates across groups (target: ±10%)
- **Equal Opportunity:** Equal allocation for equally qualified across groups

### 11.2 System Outcome Metrics

**Efficiency:**
- **Allocation Speed:** Time from demand to allocation (target: < 7 days)
- **Work Completion Rate:** % of allocated work completed (target: > 85%)
- **Capacity Utilization:** % of available positions filled (target: > 90%)

**Equity:**
- **Gender Balance:** Female allocation rate (target: ≥ 33%)
- **Caste Parity:** Proportional representation (target: ±5% of population)
- **Disability Inclusion:** Allocation rate for disabled workers (target: ≥ 5%)

**User Satisfaction:**
- **Satisfaction Score:** Post-work survey (target: > 4.0/5.0)
- **Grievance Rate:** % of allocations with grievances (target: < 2%)
- **Trust Score:** User confidence in system fairness (target: > 75%)

**Impact:**
- **Days Without Work:** Average reduction (target: -30% from baseline)
- **Vulnerable Coverage:** % of vulnerable workers allocated (target: > 80%)
- **Fraud Reduction:** Decrease in fraudulent allocations (target: -50%)

### 11.3 Continuous Monitoring

**Daily Dashboards:**
- Real-time priority queue status
- Fairness metric trends
- Fraud alerts and investigations
- Allocation vs demand gap

**Weekly Reports:**
- Allocation outcomes by group
- Model performance degradation checks
- User feedback summary
- Escalation case review

**Monthly Audits:**
- Comprehensive fairness audit
- Bias detection across dimensions
- Model retraining assessment
- Policy recommendation updates

---

## 12. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Months 1-3)
- Database design and data collection infrastructure
- Historical data cleaning and feature engineering
- Baseline ML models (priority scoring, fraud detection)
- Initial explainability framework

### Phase 2: AI Integration (Months 4-6)
- Conversational AI development (NLP models)
- Real-time data extraction and integration
- Model ensemble deployment
- API development for AI-Model communication

### Phase 3: Optimization (Months 7-9)
- Fair allocation optimizer implementation
- Advanced fraud detection (graph neural networks)
- Empathetic context understanding (transformer models)
- Comprehensive explainability (SHAP, counterfactuals)

### Phase 4: Testing & Refinement (Months 10-12)
- Pilot in select blocks/districts
- User testing and feedback integration
- Fairness auditing and bias correction
- Performance optimization

### Phase 5: Deployment & Scaling (Months 13-18)
- Phased rollout across state
- Continuous monitoring and model updates
- Training for officials and users
- Grievance mechanism integration

### Phase 6: Continuous Improvement (Ongoing)
- A/B testing for fairness improvements
- Model retraining with new data
- Feature additions based on field feedback
- Policy impact analysis

---

## 13. CONCLUSION

This ML/DL system for MGNREGA work allocation represents a paradigm shift from manual, often biased allocation to **data-driven, fair, transparent, and empathetic decision-making**. By integrating conversational AI with advanced machine learning, the system ensures:

✅ **Priority to those most in need** (urgency-based scoring)  
✅ **Fairness across all groups** (demographic parity, bias mitigation)  
✅ **Fraud prevention** (anomaly detection, network analysis)  
✅ **Complete transparency** (explainable AI with SHAP, counterfactuals)  
✅ **Empathetic engagement** (NLP-powered context understanding)  
✅ **Actionable insights** (clear recommendations for conversational AI)  

The system transforms MGNREGA from a welfare scheme often plagued by delays and inequities into a **responsive, intelligent, and compassionate** livelihood guarantee that truly serves India's most vulnerable rural workers.

---

## APPENDIX A: Sample Database Schema

```sql
-- Workers Table
CREATE TABLE workers (
    job_card_number VARCHAR(50) PRIMARY KEY,
    aadhaar_number VARCHAR(12) ENCRYPTED,
    full_name VARCHAR(200),
    age INT,
    gender VARCHAR(10),
    caste_category VARCHAR(10),
    disability_status BOOLEAN,
    mobile_number VARCHAR(15),
    address TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    -- ... all personal fields
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Work History Table
CREATE TABLE work_history (
    work_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    work_site_id VARCHAR(50),
    work_start_date DATE,
    work_end_date DATE,
    days_worked INT,
    work_type VARCHAR(100),
    wages_paid DECIMAL(10, 2),
    payment_date DATE,
    attendance_rate DECIMAL(5, 2),
    quality_rating INT,
    created_at TIMESTAMP
);

-- Current Demand Table
CREATE TABLE work_demands (
    demand_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    demand_date TIMESTAMP,
    urgency_level VARCHAR(20),
    preferred_work_site VARCHAR(50),
    status VARCHAR(20),  -- PENDING, ALLOCATED, REJECTED
    priority_score DECIMAL(5, 2),
    allocated_date TIMESTAMP,
    created_at TIMESTAMP
);

-- Vulnerability Data Table
CREATE TABLE vulnerability_data (
    vulnerability_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    bpl_status VARCHAR(20),
    household_members INT,
    dependents INT,
    earning_members INT,
    food_insecurity_score INT,
    medical_emergency BOOLEAN,
    chronic_illness_family BOOLEAN,
    debt_amount DECIMAL(10, 2),
    -- ... all vulnerability fields
    updated_at TIMESTAMP
);

-- Conversational Logs Table
CREATE TABLE conversation_logs (
    log_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    conversation_date TIMESTAMP,
    user_input TEXT,
    ai_response TEXT,
    extracted_entities JSONB,
    sentiment_score DECIMAL(3, 2),
    urgency_detected BOOLEAN,
    crisis_flags JSONB,
    created_at TIMESTAMP
);

-- Model Decisions Table
CREATE TABLE model_decisions (
    decision_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    decision_date TIMESTAMP,
    decision_type VARCHAR(50),  -- PRIORITY, FRAUD, ALLOCATION
    input_features JSONB,
    model_output JSONB,
    explanation JSONB,
    human_review BOOLEAN,
    human_override BOOLEAN,
    created_at TIMESTAMP
);

-- Fraud Flags Table
CREATE TABLE fraud_flags (
    flag_id SERIAL PRIMARY KEY,
    job_card_number VARCHAR(50) REFERENCES workers(job_card_number),
    fraud_score DECIMAL(5, 2),
    fraud_type VARCHAR(50),
    flagged_date TIMESTAMP,
    investigation_status VARCHAR(20),
    resolution TEXT,
    created_at TIMESTAMP
);

-- Fairness Audit Table
CREATE TABLE fairness_audits (
    audit_id SERIAL PRIMARY KEY,
    audit_date DATE,
    allocation_batch_id VARCHAR(50),
    gender_distribution JSONB,
    caste_distribution JSONB,
    gini_coefficient DECIMAL(5, 4),
    fairness_score INT,
    issues_detected JSONB,
    created_at TIMESTAMP
);
```

---

## APPENDIX B: Sample API Endpoints

```
POST /api/v1/extract-worker-data
Request: {conversation_text, job_card_number}
Response: {extracted_fields, updated_database_fields}

POST /api/v1/calculate-priority
Request: {job_card_number, real_time_context}
Response: {priority_score, urgency_score, vulnerability_score, entitlement_score, explanation}

POST /api/v1/check-fraud
Request: {job_card_number, allocation_request}
Response: {fraud_score, fraud_risk, red_flags, verification_required}

POST /api/v1/allocate-work
Request: {job_card_numbers[], work_site_id, allocation_date}
Response: {allocation_matrix, fairness_metrics, unallocated_workers}

GET /api/v1/explain-decision
Request: {job_card_number, decision_id}
Response: {explanation_text, shap_values, counterfactuals, fairness_statement}

GET /api/v1/fairness-audit
Request: {date_range, group_by}
Response: {fairness_metrics, bias_detected, recommendations}

POST /api/v1/conversation-guidance
Request: {job_card_number, conversation_context}
Response: {empathy_level, key_messages, recommended_actions, follow_up}
```

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Status:** Draft for Review and Feedback

---

This comprehensive specification provides the foundation for building an ethical, fair, and explainable AI system that can transform MGNREGA work allocation from a bureaucratic process into an intelligent, empathetic service that truly serves India's rural poor.