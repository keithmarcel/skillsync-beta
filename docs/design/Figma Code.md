# Figma Code to help with the design of the app. Do not use this code as is, since Figma dev tools are not 100% accurate.

## Components

### Navbar

Layout:
display: flex;
padding: var(--6, 24px) var(--8, 32px);
align-items: center;
gap: var(--8, 32px);
align-self: stretch;

Styles:
border-bottom: 1px solid var(--gray-200, #E5E7EB);
background: var(--white, #FFF);

Children:

- Logo
display: flex;
flex-direction: column;
justify-content: center;
align-items: flex-start;
gap: 8px;

- Nav links
-- Active
display: flex;
padding: var(--2, 8px) var(--4, 16px);
justify-content: center;
align-items: center;
gap: var(--2, 8px);
-
border-radius: var(--rounded-lg, 8px);
background: var(--teal-500, #0694A2);
-- Inactive
display: flex;
padding: var(--2, 8px) var(--4, 16px);
justify-content: center;
align-items: center;
gap: var(--2, 8px);
-
border-radius: var(--rounded-lg, 8px);
background: var(--white, #FFF);

- Give Feedback
display: flex;
padding: var(--2, 8px) var(--3, 12px);
justify-content: center;
align-items: center;
gap: var(--2, 8px);
-
border-radius: var(--rounded-lg, 8px);
border: 1px solid var(--gray-200, #E5E7EB);
background: var(--white, #FFF);

- User Menu
display: flex;
width: 32px;
height: 32px;
padding: var(--0, 0);
flex-direction: column;
justify-content: center;
align-items: center;
gap: var(--0, 0);
-
border-radius: 16px;
background: url(<path-to-image>) lightgray 50% / cover no-repeat;


## Page Header

- Outer Container
display: flex;
width: 1800px;
height: 162px;
padding: 8px var(--0, 0);
justify-content: center;
align-items: center;
gap: 8px;
flex-shrink: 0;
-
background: var(--Secondary, #114B5F);

- Inner Container
display: flex;
width: 1280px;
max-width: 1280px;
padding: 0 var(--6, 24px) var(--spacing-0, 0) var(--6, 24px);
flex-direction: column;
align-items: center;
gap: var(--spacing-6, 24px);
flex-shrink: 0;
-
- Inner Container Typography
color: var(--tailwind-colors-base-white, #FFF);

/* custom/heading-md */
font-family: var(--heading-md-font-family, Geist);
font-size: var(--heading-md-font-size, 30px);
font-style: normal;
font-weight: var(--heading-md-font-weight, 700);
line-height: var(--heading-md-line-height, 36px); /* 120% */
letter-spacing: var(--heading-md-letter-spacing, 0);
color: var(--teal-50, #EDFAFA);

/* text-base/leading-normal/normal */
font-family: var(--font-font-sans, Geist);
font-size: var(--text-base-font-size, 16px);
font-style: normal;
font-weight: var(--font-weight-normal, 400);
line-height: var(--text-base-line-height, 24px); /* 150% */

---

# Badges


## Neutral
  "badge-neutral-bg": "#F3F4F6",
  "badge-neutral-text": "#111928",
  "badge-neutral-radius": "10px"


## My Assessments Page

### Cards: Assessment Type
    "Skills Assessment":"primary": "#1F2A37", "surface": "#F3F4F6" 
    "Resume Upload": "primary": "#1F2A37", "surface": "#F3F4F6"

### Cards: Role Readiness
    "Ready":
      "badge.fill": "#84E1BC",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "semantic": "success"

    "Close Gaps": 
      "badge.fill": "#FDBA8C",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "semantic": "warning"

    "Needs Development": 
      "badge.fill": "#F8B4B4",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "semantic": "danger"

### Cards: Recommendations
    "Apply": 
      "surface.fill": "#F3FAF7",
      "accent.fill": "#31C48D",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "onAccent.text": "#FFFFFF",
      "semantic": "successAction"
    "Retake":
      "surface.fill": "#FDF2F2",
      "accent.fill": "#F98080",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "onAccent.text": "#FFFFFF",
      "semantic": "retryAction"
    "Gaps":
      "surface.fill": "#FFF8F1",
      "accent.fill": "#FF8A4C",
      "icon.fill": "#1F2A37",
      "text.color": "#1F2A37",
      "onAccent.text": "#FFFFFF",
      "semantic": "infoHighlight"


## Featured Roles, Hgh Demand Occupations, Job Favorites Tabs

### Table: Job Category
    "Health & Education": "primary": "#1E429F", "surface": "#F6F5FF" 
    "Logistics":          "primary": "#014451", "surface": "#EDFAFA" 
    "Hospitality":        "primary": "#633112", "surface": "#FCE8F3" 
    "Finance & Legal":    "primary": "#42389D", "surface": "#E5EDFF" 
    "Public Services":    "primary": "#8A2C0D", "surface": "#FFF8F1" 
    "Tech & Services":    "primary": "#5521B5", "surface": "#EDEBFE" 
    "Skilled Trades":     "primary": "#99154B", "surface": "#FCE8F3" 
    "Business":           "primary": "#1E429F", "surface": "#E1EFFE" 

### Table: Role Readiness
    "ready":
      "badge.fill": "#84E1BC",
      "icon.fill": "#374151",
      "text.color": "#374151",
      "semantic": "success"
    "close gaps":
      "badge.fill": "#FDBA8C",
      "icon.fill": "#374151",
      "text.color": "#374151",
      "semantic": "warning"
    "assess skills":
      "badge.fill": "#F3F4F6",
      "icon.fill": "#374151",
      "text.color": "#374151",
      "semantic": "neutral"

### Card: Featured Roles Metric
  "card-callout-featured-role-data-bg": "#F3FAF7",
  "card-callout-featured-role-data-border": "#E5E7EB",
  "card-callout-featured-role-data-title": "#1F2A37",
  "card-callout-featured-role-data-body": "#6B7280",
  "card-callout-featured-role-data-accent": "#31C48D",
  "card-callout-featured-role-data-surface": "#FFFFFF"


## Featured Programs Tabs

### Card: Featured Programs Skills Callout
  "card-callout-program-job-skills-bg": "#F0F5FF",
  "card-callout-program-job-skills-surface": "#F9FAFB",
  "card-callout-program-job-skills-title": "#1F2A37",
  "card-callout-program-job-skills-accent": "#1C64F2",
  "card-callout-program-job-skills-radius": "8px"