# SkillSync Application Data Structure

## User Management

### User Account Data
- **Email Address**: String, required for authentication
- **Password**: String, required for authentication  
- **First Name**: String, optional, can be added during account creation or later in settings
- **Last Name**: String, optional, manageable in account settings
- **Zip Code**: String, optional, can be added during account creation or later in settings
- **User Avatar**: Image file, optional, defaults to default graphic with user initials

### Authentication Flow
- **Create Account**: Email address and password required
- **Sign In**: Email and password authentication only
- **Reset Password**: Password reset flow available
- **No External Authentication**: Email and password only

## Dashboard Components

### Page Header
- **Dynamic Greeting**: 
  - First login with first name provided: "Welcome, [first name]!"
  - Subsequent logins with first name: "Welcome back, [first name]!"
  - First login without first name: "Welcome!"
  - Subsequent logins without first name: "Welcome back!"

### SkillSync Snapshot Cards

#### Card 1: Roles Ready For
- **Purpose**: Display roles user has shown proficiency in
- **Calculation**: Roles where user scored 85% or higher on skills assessment
- **Value Type**: Percentage
- **Example**: "60%"

#### Card 2: Overall Readiness Percentage
- **Purpose**: Aggregate percentage from all assessments and resume uploads
- **Calculation**: Combined score from all skills assessments taken
- **Value Type**: Percentage
- **Example**: Identical to roles ready for percentage

#### Card 3: Skills Identified
- **Purpose**: Total unique skills identified from resume extraction or correct quiz answers
- **Data Sources**: 
  - Skills extracted from resume via SkillSync skills extractor
  - Skills from quiz questions answered correctly (85% proficiency or higher)
- **Value Type**: Integer count
- **Example**: "89 skills"

#### Card 4: Gaps Highlighted
- **Purpose**: Skills needing development or building proficiency
- **Calculation**: 
  - Building proficiency: 50% to 85% skill score
  - Needs development: 0% to 49% skill score
- **Value Type**: Integer count
- **Example**: "56 gaps"

#### Card 5: Skill Proficiency Breakdown
- **Total Skills Assessed**: Combination of skills identified + gaps highlighted
- **Pie Chart Data**:
  - Total skills assessed count (example: 145)
  - Proficient percentage (example: 45%)
  - Building proficiency percentage (example: 20%)
  - Needs development percentage (example: 34%)
- **AI Summary**: Two-sentence AI-generated overview and encouragement
- **Refresh Trigger**: Only updates when new assessment data available
- **Strongest Skill Area Link**: Links to page showing all roles/occupations containing user's strongest skill
- **Skills Nearest to Proficiency**: Shows highest scoring skill still in building proficiency range with link to matching programs

### Saved Items Dashboard Section
- **Saved Jobs**: Role or occupation name, description, link to original job posting, job details button
- **Saved Programs**: School name, program name, program details button

## Company Sponsor Data

### Company Profile
- **Company Logo**: Image file for trusted partner display
- **Company Name**: String
- **Company Bio**: One to two paragraph description
- **Headquarters**: Location string
- **Revenue**: Text string (example: "500 million to 1 billion USD")
- **Employees**: Text string (example: "1,001 to 5,000")
- **Industry**: Category string (example: "Construction")
- **Trusted Partner Status**: Boolean flag

### Company Modal Display
- **Company Logo**: Image display
- **Company Image**: Additional company image
- **Company Name**: Text display
- **Company Bio**: Full description text
- **Revenue**: Revenue range display
- **Employees**: Employee count range
- **Industry**: Industry category

## Jobs Data Structure

### Job Categories
- **Universal Categories**: Apply to both featured roles and high-demand occupations
- **Category Types**: Skilled trades, business, etc.

### Featured Roles
- **Company Logo**: From company sponsor data
- **Trusted Partner Badge**: Boolean display based on company status
- **Job Title**: Featured role title string
- **Job Category**: From universal job categories
- **Job Type**: Full-time, part-time, internship, contractor
- **Mapped Skills Count**: Integer showing number of skills being tested
- **Short Job Description**: Brief description text
- **Long Job Description**: Two to three sentence detailed description
- **Median Salary**: Salary amount for role
- **Job Location**: Geographic location string
- **Education Requirements**: Required education level
- **Featured Image**: Custom image per job uploaded to SkillSync
- **Company Profile Link**: Modal trigger for company information
- **Job Details Link**: Link to specific role details page

### High-Demand Occupations Data Item
- **Occupation Name**: Title string (example: "Electricians")
- **Occupation Summary**: One sentence description
- **Occupation Category**: From universal job categories
- **Median Annual Salary**: Salary amount
- **SOC Code**: Standard Occupational Classification code (example: "13-1082")
- **Projected Open Positions**: Regional projection number
- **Typical Education Requirements**: Education level string
- **Job Growth Outlook**: Percentage growth projection (example: "+8% through 2030")
- **Long Job Description**: Multi-sentence detailed description
- **Featured Image**: Custom image per occupation

### High-Demand Occupations Table Columns
- **Occupation Name**: Title string (example: "Electricians")
- **Occupation Summary (Short)**: One sentence description
- **Occupation Category**: From universal job categories
- **Median Annual Salary**: Salary amount
- **Role Readiness Status**: user's next action on the occupation (assess skills / no actions yet, close gaps / scored 50-84%, ready / scored 85%+)
- **Row Actions**: Occupation details link, separator, upload a resume, take a skills assessment, separator, add to favorites (or remove from favorites if already favorited)

### Role Readiness Status
- **Assess Skills**: Default status for users with no interactions
- **Close Gaps**: Status for users scoring 50-84% on assessments
- **Role Ready**: Status for users scoring 85% or above
- **Status Actions**: 
  - Assess Skills: Upload resume or start quiz options
  - Close Gaps: Links to matching programs
  - Role Ready: Ready to apply indication

### Favorites Tab
- **Saved Jobs**: User-favorited roles and occupations only
- **Structure**: Utilized SkillSync DataTable component
- **Columns**: Occupation Name, Occupation Summary (Short), Median Annual Salary, Role Readiness Status, Table Actions
- **TableActions**: Job details link (Role Details or Occupation Details), separator, upload a resume, take a skills assessment, separator, remove from favorites


## Job Details Page Structure

### Page Header
- **Job Title**: Featured role title or high-demand occupation title
- **SOC Code**: Classification code for all jobs
- **Favorite Button**: Dynamic text ("Favorite Role" or "Favorite Occupation")

### Company Sponsor Callout (Featured Roles Only)
- **Company Logo**: From sponsor data
- **Dynamic Sentence**: "[Job Title] is an in-demand role at [Company Name]"
- **Trusted Partner Badge**: Conditional display
- **About Company Button**: Opens company profile modal

### Job Overview
- **Section Title**: "Role Overview" for featured roles, "Occupation Overview" for occupations
- **Job Title Display**: Role or occupation name
- **Tags**: 
  - Featured roles: Job category, job type, skills count
  - Occupations: Job category, skills count
- **Median Salary**: Salary amount
- **Additional Data**:
  - Featured roles: Location, education requirements, proficiency score
  - Occupations: Projected open positions, education requirements, job growth outlook
- **Long Description**: Multi-sentence job description
- **Featured Image**: Custom job image

### Skills and Responsibilities
- **Core Skills**: List of skill names matching skills count from overview
- **Core Responsibilities**: Bulleted list of job responsibilities
- **Related Job Titles**: Bulleted list (occupation details only) of related positions by SOC code

### Skills Gap Assessment Section
- **Upload Resume Option**: Triggers resume upload and assessment flow
- **Start Quiz Option**: Triggers job-specific quiz assessment flow

### Who's Hiring Section (Occupations Only)
- **Purpose**: Show company sponsors hiring for same SOC code
- **Display**: "Trusted partners in your area are hiring for this occupation"
- **Company Logos**: Display of hiring companies
- **Connection Logic**: Match company jobs to occupation SOC code

## Assessment Flow Data

### Resume Upload Process
- **Upload Capability**: File upload for resume processing
- **AI Processing**: LLM extraction of skills from resume
- **Data Retention**: Extract skills, discard resume file
- **Job Connection**: Maintain connection to originating job/occupation

### SkillSync Readiness Score Results
- **Skills Demonstration**: "You've demonstrated X of X core skills"
- **Conditional Messaging**: 
  - 50-85% range: "You're close to being role ready"
- **Match Percentage**: "Based on your assessment, you have X% match with skills required for [job title]"
- **AI Summary**: Two to three sentence assessment overview
- **Role Readiness Score**: Percentage value
- **Visualization**: 10-bar vertical chart filled based on percentage
- **Program Matches Badge**: Count of matching programs in stepper
- **View Program Matches Button**: Link to education program matches

### Skill Gap Analysis Visualization
- **Skills Display**: All assessed skills for the job
- **Horizontal Bar Charts**: 100% scale for each skill
- **Individual Skill Scores**: Percentage for each assessed skill
- **Proficiency Categories**:
  - Needs Development: 0-49%
  - Building Proficiency: 50-84%
  - Proficient: 85-100%
- **Overall Calculation**: Average of all skill scores for role readiness
- **Gap Identification**: Skills scoring 84% or lower connect to relevant programs

## Quiz Assessment Data

### Quiz Structure
- **Job-Specific Quizzes**: Unique quiz for each featured role and occupation
- **Skill Mapping**: Quiz questions mapped to required job skills
- **Question Pool**: Multiple questions per skill for variety
- **Company Customization**: Additional questions for featured roles from sponsors
- **Multiple Choice Format**: All quiz questions multiple choice

### Quiz Flow
- **Introduction Card**: "See how your skills stack up" with dynamic job title
- **Time Estimate**: Calculated based on question count
- **Skill Sections**: Separate section for each assessed skill
- **Multiple Questions**: Multiple questions per skill section
- **Assessment Engine**: Processes answers against skill mappings and job requirements

---
## Education Programs Data

### Program Information
- **School Name**: Educational institution name
- **School Logo**: Institution logo image
- **Program Name**: Specific program title
- **Program Type**: Certificate, bachelor's, associates, credential
- **Program Format**: Online, hybrid, in-person
- **Program Duration**: Text string (examples: "2 weeks", "12 weeks", "2 years")
- **Program Description**: Short sentence description
- **Mapped Skills**: Skills covered by the program
- **About School Link**: External link to school website
- **Program Details Link**: External link to specific program page

### Program-Job Connections
- **Skills Mapping**: Programs connected to jobs through shared skills
- **Job Count Display**: "This program provides skills for X jobs"
- **See Jobs Button**: Shows jobs/occupations with matching skills

### Featured Programs Tab
- **Program Cards**: Display school logo, name, program details, tags, description
- **Skills for Jobs Callout**: Count and link to related positions

### All Programs Tab
- **Table Format**: Six columns displaying program information
- **Columns**: Name, Summary, Type, Format, Duration, Actions
- **Actions**: About school link, program details link, favorite program option

### Favorites Tab
- **Structure**: Utilized SkillSync DataTable component
- **Columns**: Program name, summary (short), type, format, school, actions
- **Row Actions**: Program details link, about the school link, separator, jobs with matching skills, separator, remove from favorites


---
## My Assessments Data

### Assessment Cards
- **Job Information**: Featured role or high-demand occupation name
- **Job Type Badge**: "Featured Role" or "High Demand" indicator
- **Status Tags**:
  - Role Ready: 85%+ score
  - Close Gaps: 50-84% score  
  - Needs Development: 0-49% score
- **Assessment Method Badge**: "Skills Assessment" or "Resume Upload"
- **Analysis Date**: Date assessment was completed
- **Progress Bar**: Skills gaps identified out of total skills
- **Next Steps Callouts**:
  - Role Ready: "Recommend applying for this [role/occupation]"
  - Close Gaps: "Gaps: [specific skill areas]"
  - Needs Development: "Recommend retaking skills assessment"

### Assessment Actions
- **Role Ready Status**: "Share Readiness Score" button (flow TBD)
- **Close Gaps Status**: "View Program Matches" button
- **Needs Development Status**: "Upload Resume" and "Retake Quiz" buttons

## Navigation and User Interface

### Feedback System
- **Modal Interface**: "Give feedback, report an issue or let us know you like SkillSync"
- **Emoji Selection**: Three distinct emojis with numerical rankings
- **Optional Text**: Text box for additional feedback
- **Data Storage**: All feedback interactions stored in feedback data element

### User Avatar Menu
- **Avatar Display**: User photo or default graphic with initials
- **Context Menu Items**:
  - User image (uploaded or default)
  - User name (first and last if provided, otherwise email)
  - Account Settings
  - My Assessments
  - Saved Jobs
  - Saved Programs
  - Sign Out

### Account Settings
- **Manageable Information**: Email address, first name, last name, password, avatar
- **Standard Functionality**: Update personal information and account credentials