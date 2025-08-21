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