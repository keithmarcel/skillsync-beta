# CIP and CIP-SOC Pipeline Scaffolding

## Overview

The primary goal of building the CIP and CIP-SOC pipelines is to unify educational programs, occupations, and skills through a structured and scalable data flow. This process begins with the Classification of Instructional Programs (CIP), maps to Standard Occupational Classification (SOC) codes, and finally links to granular skills data. This unification enables comprehensive program-to-skill mapping, facilitating skill-based search, analysis, and workforce alignment.

By integrating authoritative data sources and APIs, the pipelines provide a robust foundation for skill taxonomy enrichment, labor market analysis, and educational program evaluation. The scaffolding presented here demonstrates how to combine bulk datasets, crosswalks, and live API services into a cohesive architecture that supports both batch ETL processes and real-time queries.

---

## Data Sources & Access

This section details the primary data sources and APIs used in the CIP and CIP-SOC pipelines, including access information, usage notes, and example endpoints.

### O*NET Web Services

- **API URL:** https://services.onetcenter.org/ws/
- **Registration:** Requires API key registration at [O*NET Web Services Registration](https://services.onetcenter.org/register/)
- **Example Endpoint:**  
  `https://services.onetcenter.org/ws/online/occupations/{SOC_CODE}/skills`  
  (Replace `{SOC_CODE}` with a valid SOC code, e.g., `15-1121`)
- **What It Returns:**  
  Detailed occupational data including skills, abilities, work activities, tools and technology, and more. Responses are typically in XML or JSON format and include skill importance and level ratings.
- **Usage Notes:**  
  O*NET Web Services provide up-to-date occupational information and skill mappings. It is best used for real-time lookups and detailed skill retrieval per SOC code.

### O*NET Crosswalks (CSV)

- **Download Link:**  
  https://www.onetcenter.org/crosswalks.html  
  (Direct CSV files available for CIP to SOC mappings)
- **Format:** CSV files containing mappings between CIP codes and SOC codes with confidence scores.
- **Usage:**  
  Used to establish relationships between educational programs (CIP codes) and occupations (SOC codes). These crosswalks are static datasets best ingested in bulk during ETL processes to populate relational tables.

### NCES CIP Directory

- **Link:**  
  https://nces.ed.gov/ipeds/cipcode/
- **Taxonomy Notes:**  
  The CIP Directory is the authoritative taxonomy of instructional programs, maintained by the National Center for Education Statistics (NCES). It provides hierarchical CIP codes and descriptive titles for programs.
- **Usage:**  
  Used to tag educational programs with standardized CIP codes. This directory serves as the foundation for program identification and classification.

### IPEDS Program-Level Datasets

- **Download Portal:**  
  https://nces.ed.gov/ipeds/use-the-data
- **What’s Included:**  
  Institutional data on program offerings, enrollments, completions, and demographics at the program level.
- **How to Query:**  
  Data can be downloaded as CSV or accessed via the IPEDS Data Center. Queries can be customized by institution, program CIP code, and year.
- **Usage:**  
  Used to assign CIP codes to actual educational programs and gather enrollment statistics. Typically ingested in bulk for institutional program profiling.

### CareerOneStop API

- **Link:**  
  https://www.careeronestop.org/Developers/Developers.aspx
- **What Endpoints Return:**  
  Occupational information, wage data, career exploration tools, and job postings. The API supports queries by SOC code and keywords.
- **Usage:**  
  Used as a complementary source of occupational and labor market data. Can be used for enrichment and validation of SOC-related information.

### Lightcast Open Skills

- **Link:**  
  https://www.lightcast.io/open-skills-dataset
- **Attribution Note:**  
  Lightcast provides an open skills taxonomy and mappings that enrich occupational and program data with skill-level detail.
- **Usage:**  
  Used to supplement skill data, especially for skills not covered in O*NET or for additional taxonomic relationships.

### State Workforce Datasets

- **Example:** Florida Department of Economic Opportunity (DEO) Training and Occupational Licensing (TOL) Dataset
- **Link Placeholder:**  
  (Insert state-specific workforce data URLs here)
- **Usage:**  
  Provides regional labor market data, program offerings, and occupational licensing information. Typically static datasets ingested periodically to capture localized program-to-occupation mappings.

### Optional BLS Public Data API

- **API Link:**  
  https://www.bls.gov/developers/
- **Key Requirement:**  
  Requires registration and API key.
- **Usage:**  
  Provides additional occupational employment statistics, wage data, and projections. Optional enrichment source for occupational data.

---

## Implementation Architecture

The pipeline architecture follows a logical progression from educational programs to skills via occupational mappings:

```
Programs (tagged with CIP codes) → CIP to SOC Crosswalk → SOC Skills (O*NET) → Program-to-Skill Linkages → Skill-based Search
```

Each stage is detailed below with technical considerations and examples.

### 1. Tag Programs with CIP Codes

- **Data Sources:** NCES CIP Directory, IPEDS Program-Level Datasets
- **Process:**  
  - Extract program data from IPEDS datasets, which include program titles and institutional identifiers.
  - Match or assign CIP codes to programs using the NCES CIP Directory taxonomy.
- **Example:**  
  Query IPEDS for programs at a given institution and join on CIP code descriptions to tag each program with a standardized CIP code.
- **Technical Notes:**  
  - Store program information in a `program_cip` table with columns such as `program_id`, `institution_id`, `cip_code`, `program_name`, and `year`.
  - Ensure data normalization for efficient querying.

### 2. Map CIP to SOC Codes

- **Data Source:** O*NET Crosswalks (CSV)
- **Process:**  
  - Load the CIP to SOC crosswalk CSV into a relational table, e.g., `cip_soc`.
  - Each record maps a CIP code to one or more SOC codes, with a confidence or mapping score.
- **Example:**  
  A CIP code `14.0901` (Computer Engineering) may map to SOC `15-1133` (Software Developers).
- **Technical Notes:**  
  - Use this table to join program CIP codes to SOC occupational codes.
  - Handle many-to-many relationships as a program may map to multiple SOCs.

### 3. Pull SOC Skills via O*NET

- **Data Source:** O*NET Web Services API
- **Process:**  
  - For each SOC code obtained from the crosswalk, call the O*NET API to retrieve associated skills.
  - Parse the returned data to extract skill names, importance, and level ratings.
- **Example API Call:**  
  `GET https://services.onetcenter.org/ws/online/occupations/15-1133/skills`
- **Technical Notes:**  
  - Cache retrieved skill data in a `soc_skills` table with fields such as `soc_code`, `skill_id`, `skill_name`, `importance`, and `level`.
  - Implement rate limiting and error handling for API calls.
  - Consider batch retrieval or parallelization for efficiency.

### 4. Link Programs to Skills

- **Process:**  
  - Join `program_cip` → `cip_soc` → `soc_skills` tables to create a `program_skills` linkage table.
  - This table represents the inferred skills associated with each educational program.
- **Example:**  
  A program tagged with CIP `14.0901` maps to SOC `15-1133`, which has skills like "Programming" and "System Analysis". These skills become linked to the program.
- **Technical Notes:**  
  - Store `program_skills` with columns: `program_id`, `skill_id`, `skill_name`, `importance`, `level`.
  - Allow filtering by skill importance or level for search relevance.

### 5. Expose Search by Skills

- **Process:**  
  - Implement search functionality that allows users to find programs based on required or desired skills.
  - Queries traverse the `program_skills` table to find matching programs.
- **Example:**  
  A user searches for programs teaching "Data Analysis". The system queries `program_skills` for skill matches and returns associated programs.
- **Technical Notes:**  
  - Optimize search using full-text indexes or skill tagging.
  - Provide APIs or UI components for skill-based program discovery.

---

## API Account Requirements

| Source                 | Access Type        | API Key Required? | Link                                                    |
|------------------------|--------------------|-------------------|---------------------------------------------------------|
| O*NET Web Services     | REST API           | Yes               | https://services.onetcenter.org/register/               |
| O*NET Crosswalks       | CSV Download       | No                | https://www.onetcenter.org/crosswalks.html              |
| NCES CIP Directory      | Bulk Data / Web    | No                | https://nces.ed.gov/ipeds/cipcode/                       |
| IPEDS Program Datasets  | Bulk Data / Web    | No                | https://nces.ed.gov/ipeds/use-the-data                   |
| CareerOneStop API       | REST API           | Yes               | https://www.careeronestop.org/Developers/Developers.aspx|
| Lightcast Open Skills   | Bulk Data          | No                | https://www.lightcast.io/open-skills-dataset             |
| State Workforce Datasets| Bulk Data          | No                | (State-specific URLs)                                    |
| BLS Public Data API     | REST API           | Yes               | https://www.bls.gov/developers/                          |

---

## Integration Recommendations for Windsurf

### API Usage Strategy

- **Real-Time Lookups:**  
  Use O*NET Web Services and CareerOneStop APIs for dynamic, up-to-date occupational and skill data retrieval. These APIs provide detailed and current information suitable for user-facing queries and skill enrichment.

- **Bulk ETL Loads:**  
  Use O*NET Crosswalks, NCES CIP Directory, IPEDS datasets, Lightcast Open Skills, and State Workforce datasets as bulk data sources. These datasets are updated periodically and should be ingested into the database in batch processes.

- **Optional Enrichment:**  
  The BLS Public Data API can be used optionally to provide additional labor market statistics and projections.

### Data Staging in Supabase

- **Schema-Level Details:**  
  - `program_cip`: Stores program metadata and CIP codes.  
    Columns: `program_id` (PK), `institution_id`, `cip_code`, `program_name`, `year`, `source`.
  - `cip_soc`: Stores CIP to SOC mappings.  
    Columns: `cip_code`, `soc_code`, `mapping_score`.
  - `soc_skills`: Stores skills associated with SOC codes.  
    Columns: `soc_code`, `skill_id`, `skill_name`, `importance`, `level`.
  - `program_skills`: Stores inferred skills per program.  
    Columns: `program_id`, `skill_id`, `skill_name`, `importance`, `level`.

- **Data Relationships:**  
  - `program_cip` joins to `cip_soc` on `cip_code`.  
  - `cip_soc` joins to `soc_skills` on `soc_code`.  
  - `program_skills` materializes the join of program to skills.

### Periodic Ingestion Handling

- Schedule ETL jobs to download and process static datasets (O*NET Crosswalks, NCES CIP, IPEDS, Lightcast, State Workforce) on a monthly or quarterly basis.
- Validate and normalize data before ingestion to ensure consistency.
- Use staging tables to compare new data with existing records for incremental updates.
- Archive previous versions for audit and rollback.

### Additional Recommendations

- Implement caching layers for API responses to minimize external calls and improve performance.
- Monitor API usage quotas and handle rate limiting gracefully.
- Design the database schema with indexing on key columns (`cip_code`, `soc_code`, `skill_id`) to optimize join performance.
- Document ETL processes and data refresh schedules for maintainability.

---

By following this detailed scaffolding and integration plan, Windsurf can build a robust and extensible pipeline that effectively links educational programs to occupational skills, enabling advanced skill-based search, analytics, and workforce alignment.
