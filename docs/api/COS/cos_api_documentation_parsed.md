## List Occupations by Keyword

### API Name and Purpose
**List Occupations by Keyword**  
This API allows users to retrieve a list of occupations that match a given keyword.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/occupation/{userId}/{keyword}/{dataLevelOnly}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter
Name Value Required? Description
This value is the unique API Token provided during the CareerOneStop web services
API Token String Required
registration process
This value is the unique UserID provided during the CareerOneStop web services
userId String Required
registration process
Keyword or O*NET code. O*NET codes may be in format ##-####.## or ########. SOC, 
keyword String Required OES, and MAT codes may be in format ###### or ##-####.
If Y or Yes, and if searchBy is onet, then the response will include only data-level O*NET
dataLevelOnly String Required occupations. If N or No, then the response will include both O*NET data-level and O*NET
broad occupations. Acceptable values include: Y,Yes,N,No.
Use this parameter to set the starting record number of the returned dataset. This value
startRecord Integer Required must be a nonnegative integer. Default value is 0, indicating the first record is the starting
record.
Use this parameter to set the maximum number of occupational records returned. This value
limitRecord Integer Required must be a positive integer. Default value is 10, indicating that no more than 10 records will be
returned.
Use this parameter to determine whether to include MetaData in the response.
enableMetaData boolean Optional True- Include metadata (default)
False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/occupation/Mjhk88lGwdxlgnP/engineer/Yes/0/10"
```

### Example response
```json
{
  "totalResults": 120,
  "page": 1,
  "pageSize": 10,
  "occupations": [
    {
      "occupationCode": "17-2071",
      "title": "Electrical Engineers",
      "description": "Design, develop, test, and supervise the manufacturing of electrical equipment."
    },
    {
      "occupationCode": "17-2112",
      "title": "Industrial Engineers",
      "description": "Find ways to eliminate wastefulness in production processes."
    }
  ]
}
```

### Error codes
- `400` Bad Request: Invalid or missing parameters.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: No occupations found for the given keyword.
- `500` Internal Server Error: Server error.


## Get Occupation Details

### API Name and Purpose
**Get Occupation Details**  
Retrieves detailed information about a specific occupation by occupation code.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/occupation/{userId}/{onetOrTitle}/{location}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
This value is the unique API Token provided during the CareerOneStop Web API registration process.
API Token String Yes
This value is the unique UserID provided during the CareerOneStop Web API registration process.
userId String Yes
O*NET code or O*NET Detailed Occupation Title
keyword String Yes
Acceptable values include State Postal Codes (e.g., CA), State FIPS Codes (e.g., 06), or ‘US’ for national.
location String Yes
Use this parameter to get task statements for the occupation.
tasks boolean Optional True- Include task statements
False- Exclude task statements
Use this parameter to get skills information for the occupation.
skills boolean Optional True- Include skills
False- Exclude skills
Use this parameter to get knowledge information for the occupation.
knowledge boolean Optional True- Include knowledge
False- Exclude knowledge
Use this parameter to get abilities information for the occupation.
abilities boolean Optional True- Include abilities
False- Exclude abilities
Use this parameter to get tools and technology information for the occupation.
toolsAndTechnology boolean Optional True- Include tools and technology
False- Exclude tools and technology
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/occupation/Mjhk88lGwdxlgnP/29-1141.00/US?tasks=true&skills=true&knowledge=true&abilities=true&toolsAndTechnology=true"
```

### Example response
```json
{
  "occupationCode": "17-2071",
  "title": "Electrical Engineers",
  "description": "Design, develop, test, and supervise the manufacturing of electrical equipment.",
  "tasks": [
    "Design electrical systems",
    "Test equipment",
    "Supervise manufacturing"
  ],
  "skills": [
    "Analytical skills",
    "Problem-solving skills"
  ],
  "education": "Bachelor's degree",
  "wages": {
    "median": 100000,
    "percentile10": 65000,
    "percentile90": 140000
  }
}
```

### Error codes
- `400` Bad Request: Invalid occupation code.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: Occupation not found.
- `500` Internal Server Error: Server error.


## Get Job Description

### API Name and Purpose
**Get Job Description**  
Provides a detailed job description for a given occupation code.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/jdw/{userId}/{onetCode}/{state}/{category}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
onetCode String Yes O*NET code for the occupation.
state String Yes State postal abbreviation (e.g., FL) or ‘US’.
category String Yes Use a valid category for job description content grouping.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/jdw/Mjhk88lGwdxlgnP/29-1141.00/FL/core"
```

### Example response
```json
{
  "occupationCode": "17-2071",
  "jobDescription": "Electrical engineers design, develop, test, and supervise the manufacturing of electrical equipment, such as electric motors, radar and navigation systems, communications systems, and power generation equipment."
}
```

### Error codes
- `400` Bad Request: Invalid occupation code.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: Job description not found.
- `500` Internal Server Error: Server error.


## Get LMI by Occupation

### API Name and Purpose
**Get LMI by Occupation**  
Retrieves Labor Market Information (LMI) for a specified occupation.

### Resource URL / Endpoint pattern
`https://api.careeronestop.org/v1/lmi/{userId}/{occupationCode}/{location}`

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
onetCode String Yes O*NET code for the occupation.
location String Yes Acceptable values include State Postal Codes (e.g., CA), State FIPS Codes (e.g., 06), or ‘US’ for national.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/lmi/Mjhk88lGwdxlgnP/29-1141.00/FL"
```

### Example response
```json
{
  "occupationCode": "17-2071",
  "location": "CA",
  "employment": 15000,
  "medianWage": 105000,
  "growthRate": 5.2,
  "jobOpenings": 1200
}
```

### Error codes
- `400` Bad Request: Invalid parameters.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: LMI data not found.
- `500` Internal Server Error: Server error.


## Get Occupations Reports

### API Name and Purpose
**Get Occupations Reports**  
Provides detailed reports on occupations, including trends and forecasts.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/occupationsreports/{userId}/{reporttype}/{location}/{education}/{sortColumns}/{sortDirections}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
reporttype String Yes Acceptable values include: FG (Fastest Growing), HP (Highest Paying), MO (Most Openings), LE (Largest Employment), DE (Declining Employment).
location String Yes Acceptable values include State Postal Codes (e.g., CA), State FIPS Codes (e.g., 06), or ‘US’ for national.
education Integer Yes Filter by typical education level (use 0 for all).
sortColumns String Yes Acceptable values include: EE, PE, PCH, POT, PCT, IND.
sortDirections String Yes Acceptable values include: 0 (Ascending default), ASC, DESC.
startRecord Integer Yes This value is to set the starting record. Default value 0 is for the first record.
limitRecord Integer Yes This value sets the limit of the maximum number of records to be returned. Default value is 10.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/occupationsreports/Mjhk88lGwdxlgnP/FG/US/0/EE/ASC/0/10"
```

### Example response
```json
{
  "occupationCode": "17-2071",
  "report": {
    "employmentTrends": "Employment in this occupation is expected to grow 5% over the next 10 years.",
    "jobOutlook": "Positive job outlook due to increasing demand for electrical engineers.",
    "educationRequirements": "Bachelor's degree in electrical engineering or related field."
  }
}
```

### Error codes
- `400` Bad Request: Invalid occupation code.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: Report not found.
- `500` Internal Server Error: Server error.


## List Certifications

### API Name and Purpose
**List Certifications**  
Returns a list of certifications related to a specified occupation or keyword.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/certificationfinder/{userId}/{keyword}/{directFlag}/{industry}/{certType}/{organization}/{occupation}/{agency}/{sortColumn}/{sortDirections}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
keyword String Yes Keyword or O*NET code for filtering certifications.
directFlag String Yes Acceptable values include: D (Direct match) or A (All).
industry Integer Yes Industry filter; use 0 for all.
certType Integer Yes Certification type filter; use 0 for all.
organization Integer Yes Organization filter; use 0 for all.
occupation Integer Yes Occupation filter; use 0 for all (or pass O*NET code as keyword).
agency Integer Yes Accrediting agency filter; use 0 for all.
sortColumn Integer Yes Sort column index; 0 for default.
sortDirections Integer Yes Sort direction; 0 for ascending, 1 for descending.
startRecord Integer Yes Starting record; default 0.
limitRecord Integer Yes Maximum number of records; default 10.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/certificationfinder/Mjhk88lGwdxlgnP/29-1141.00/D/0/0/0/0/0/0/0/10"
```

### Example response
```json
{
  "totalResults": 25,
  "page": 1,
  "pageSize": 10,
  "certifications": [
    {
      "certificationId": "123",
      "name": "Certified Electrical Engineer",
      "description": "Certification for professional electrical engineers."
    },
    {
      "certificationId": "124",
      "name": "Project Management Professional (PMP)",
      "description": "Certification for project management skills."
    }
  ]
}
```

### Error codes
- `400` Bad Request: Invalid parameters.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: No certifications found.
- `500` Internal Server Error: Server error.


## Get License Details by ID

### API Name and Purpose
**Get License Details by ID**  
Fetches detailed information about a specific license by its ID.

### Resource URL / Endpoint pattern
`https://api.careeronestop.org/v1/license/{userId}/{licenseId}`

### Request Parameters (verbatim from COS PDF)
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
licenseId String Yes The License ID returned from the List Licenses API.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/license/Mjhk88lGwdxlgnP/456"
```

### Example response
```json
{
  "licenseId": "456",
  "name": "Licensed Professional Engineer",
  "description": "License required to practice engineering professionally.",
  "requirements": [
    "Bachelor's degree in engineering",
    "Passing the PE exam",
    "Work experience"
  ],
  "validityPeriod": "2 years"
}
```

### Error codes
- `400` Bad Request: Invalid license ID.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: License not found.
- `500` Internal Server Error: Server error.


## List Licenses

### API Name and Purpose
**List Licenses**  
Returns a list of licenses related to a specified keyword or occupation.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/license/{userId}/{keyword}/{location}/{sortColumns}/{sortDirections}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
keyword String Yes Keyword or O*NET code for filtering licenses.
location String Yes Acceptable values include State Postal Codes (e.g., CA), State FIPS Codes (e.g., 06), or ‘US’ for national.
sortColumns String Yes Sort column; acceptable values documented in PDF.
sortDirections String Yes Acceptable values include: 0 (Ascending default), ASC, DESC.
startRecord Integer Yes This value is to set the starting record. Default value 0 is for the first record.
limitRecord Integer Yes This value sets the limit of the maximum number of records to be returned. Default value is 10.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/license/Mjhk88lGwdxlgnP/engineer/FL/EE/ASC/0/10"
```

### Example response
```json
{
  "totalResults": 15,
  "page": 1,
  "pageSize": 10,
  "licenses": [
    {
      "licenseId": "456",
      "name": "Licensed Professional Engineer",
      "description": "License required to practice engineering professionally."
    },
    {
      "licenseId": "457",
      "name": "Electrical Contractor License",
      "description": "License for electrical contractors."
    }
  ]
}
```

### Error codes
- `400` Bad Request: Invalid parameters.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: No licenses found.
- `500` Internal Server Error: Server error.


## Professional Associations

### API Name and Purpose
**Professional Associations**  
Provides a list of professional associations related to a specified occupation or industry.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/professionalassociation/{userId}/{keyword}/{industry}/{occupation}/{sortColumn}/{sortDirections}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
keyword String Yes Keyword or O*NET code.
industry Integer Yes Industry code; use 0 for all.
occupation Integer Yes Occupation filter; use 0 for all.
sortColumn Integer Yes Sort column index; 0 for default.
sortDirections Integer Yes Sort direction; 0 for ascending.
startRecord Integer Yes Starting record; default 0.
limitRecord Integer Yes Maximum number of records; default 10.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/professionalassociation/Mjhk88lGwdxlgnP/engineer/0/0/0/0/0/10"
```

### Example response
```json
{
  "totalResults": 8,
  "page": 1,
  "pageSize": 10,
  "associations": [
    {
      "associationId": "789",
      "name": "Institute of Electrical and Electronics Engineers (IEEE)",
      "description": "Professional association for electronic engineering and electrical engineering."
    },
    {
      "associationId": "790",
      "name": "National Society of Professional Engineers (NSPE)",
      "description": "Professional society for licensed professional engineers."
    }
  ]
}
```

### Error codes
- `400` Bad Request: Invalid parameters.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: No associations found.
- `500` Internal Server Error: Server error.


## Employment Patterns

### API Name and Purpose
**Employment Patterns**  
Provides data on employment patterns for an occupation, including typical work schedules, industries, and employment settings.

### Resource URL / Endpoint pattern
```
https://api.careeronestop.org/v1/employmentpatterns/{userId}/{keyword}/{sortColumns}/{sortDirections}/{startRecord}/{limitRecord}
```

### Request Parameters (verbatim from COS PDF)
Refer to the following table for a list of the required and optional request parameters. All parameter names and values are case sensitive. Important: You must provide all required parameters. Submitting an empty request does not return all possible results; an empty request returns an error.
Parameter Name Value Required? Description
API Token String Yes This value is the unique API Token provided during the CareerOneStop Web API registration process.
userId String Yes This value is the unique UserID provided during the CareerOneStop Web API registration process.
keyword String Yes Keyword or O*NET code.
sortColumns String Yes Acceptable values include:
EE - Estimated employment, for the earlier year
PE - Projected employment, for the later year
PCH - Percent change
POT - Percent of total employment in the industry
PCT - Percent ("Share") of workers in this occupation who are working in this industry
IND - Industry title
sortDirections String Yes Acceptable values include:
0 - Ascending (default)
ASC - Ascending
DESC - Descending
startRecord Integer Yes This value is to set the starting record. Default value 0 is for the first record.
limitRecord Integer Yes This value sets the limit of the maximum number of records to be returned. Default value is 10.
enableMetaData boolean Optional True- Include metadata (default) False - exclude metadata

### Authentication method
API Key passed in the header as `Authorization: Bearer {COS_TOKEN}`

### Example request
```bash
curl -H "Authorization: Bearer $COS_TOKEN" \
"https://api.careeronestop.org/v1/employmentpatterns/Mjhk88lGwdxlgnP/29-1141.00/EE/ASC/0/10"
```

### Example response
```json
{
  "occupationCode": "17-2071",
  "employmentPatterns": {
    "typicalWorkSchedule": "Full-time",
    "commonIndustries": [
      "Engineering services",
      "Manufacturing"
    ],
    "employmentSettings": [
      "Offices",
      "Industrial plants"
    ]
  }
}
```

### Error codes
- `400` Bad Request: Invalid occupation code.
- `401` Unauthorized: Invalid or missing API key.
- `404` Not Found: Employment patterns not found.
- `500` Internal Server Error: Server error.
