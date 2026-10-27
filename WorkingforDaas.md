# Data Intelligence SaaS --- Product Vision, Architecture & Roadmap

> A multi-tenant SaaS platform that helps organizations turn their data
> into clear insights, forecasts, and AI-assisted decisions---without
> needing a full in-house data science team.

## 1. Executive summary

Organizations generate data across spreadsheets, databases, ecommerce
platforms, CRMs, finance tools, product analytics, and operational
systems. Many teams struggle to combine this data, trust it, analyze it,
and turn it into action.

**Our product goal:** make data analysis accessible through one secure
workspace where a customer can connect or upload data, inspect data
quality, build dashboards, ask questions in natural language, run
forecasting and machine-learning workflows, and share reports with their
team.

The product should start with a focused, reliable analytics MVP.
Advanced machine learning, deep learning, and AI features should be
added after data ingestion, permissions, metrics, and reporting are
dependable.

## 2. Why do we need this product?

Potential customer problems include:

-   Data is spread across CSV/Excel files, databases, SaaS tools, and
    business systems.
-   Teams spend hours cleaning spreadsheets and preparing recurring
    reports.
-   Business owners cannot easily answer questions such as "Why did
    sales fall last month?" or "Which products may run out of stock?"
-   Traditional dashboards show what happened but may not explain causes
    or forecast what could happen next.
-   Hiring a complete data engineering, analytics, and ML team can be
    expensive.
-   Reports may be inconsistent because teams calculate the same KPI
    differently.
-   Small and mid-sized organizations may not have the technical skills
    to deploy and monitor predictive models.

These are **hypotheses to validate with real customers**, not proof that
every organization has the same problem. Interview target users before
committing to a broad feature set.

## 3. The market gap and opportunity

Established BI products are strong at reporting and visualization. Cloud
data platforms provide storage and compute. ML platforms help technical
teams build and deploy models. Consultants can provide tailored
solutions but may involve project-based cost and delivery time.

A potential gap for our product is a simpler workflow for a specific
business audience:

1.  Upload or connect data.
2.  Get an automatic data-quality and KPI report.
3.  Create dashboards with minimal setup.
4.  Ask grounded questions about the data.
5.  Receive forecasts, anomaly alerts, and recommendations.
6.  Share results with teammates and schedule reports.

### Potential differentiation

-   **Guided onboarding:** explain each step in simple language.
-   **Fast time-to-value:** show useful profiling and charts immediately
    after upload.
-   **Business-specific templates:** start with a clear vertical, such
    as ecommerce/retail or SaaS metrics.
-   **Analytics plus action:** combine historical KPIs with forecasting
    and alerts.
-   **Transparent AI:** show the data, filters, definitions, and
    calculations behind answers.
-   **Affordable entry tier:** serve smaller teams that do not need a
    full enterprise data platform.
-   **Human-readable explanations:** make results understandable to
    non-data specialists.

This is a product hypothesis, not a claim that competitors lack these
features. Validate it through competitor research, customer interviews,
and paid pilots.

## 4. Who might pay for it?

Choose one initial customer segment instead of trying to serve every
industry on day one.

  -----------------------------------------------------------------------
  Segment                 Example problems        Potential first
                                                  features
  ----------------------- ----------------------- -----------------------
  Ecommerce and retail    Sales changes,          Sales dashboard,
                          inventory, product      product trends,
                          performance, repeat     stock-risk forecast
                          purchases               

  SaaS businesses         MRR, churn, retention,  Revenue metrics, cohort
                          customer activation     analysis, churn-risk
                                                  indicators

  Agencies                Client reporting and    Multi-client
                          campaign performance    workspaces, scheduled
                                                  reports, branded
                                                  dashboards

  Manufacturing           Defects, downtime,      Quality dashboard,
                          production variation    anomaly detection,
                                                  maintenance indicators

  Logistics               Delivery delays and     Delivery KPI dashboard,
                          capacity                ETA analysis, exception
                                                  alerts

  Finance teams           Cash flow, expense      Reconciliation support,
                          categories, unusual     cash-flow forecast,
                          transactions            anomaly flags
  -----------------------------------------------------------------------

**Suggested starting point:** ecommerce/retail or SaaS businesses with
spreadsheet-heavy reporting. Pick the segment where you can reach users,
obtain sample data, and validate willingness to pay.

## 5. Product workflow

``` text
Customer signs up
       |
Creates organization and project
       |
Uploads CSV/Excel or connects a data source
       |
Validation, profiling, cleaning and schema detection
       |
Stores original file + processed analytical data
       |
KPIs, summaries, charts and data-quality report
       |
Dashboard + natural-language analyst
       |
Forecasting, anomaly detection and ML experiments
       |
Scheduled reports, alerts and team collaboration
```

## 6. Recommended technology stack

Use a modular architecture. Keep the first release small; introduce more
infrastructure only when workload or customer needs justify it.

### Frontend

-   Next.js with TypeScript
-   React
-   Tailwind CSS
-   Recharts or Apache ECharts for native charts
-   TanStack Query for API data fetching if needed
-   React Hook Form + Zod for forms and validation

### SaaS application backend

-   NestJS with REST APIs
-   TypeScript
-   OpenAPI/Swagger for API documentation
-   JWT or secure session-based authentication
-   Role-based access control (RBAC)

Next.js route handlers can be used initially, but a separate NestJS
backend is a reasonable choice when the API, jobs, and business modules
grow.

### Analytics and AI service

-   Python + FastAPI
-   pandas and NumPy for data handling
-   DuckDB for fast local/embedded analytical SQL on uploaded files
-   scikit-learn for classical ML
-   statsmodels for statistical analysis and forecasting
-   SHAP for supported model explanations
-   PyTorch for later deep-learning features
-   LLM provider API for grounded natural-language analysis, with strict
    access controls

### Data and infrastructure

-   PostgreSQL for users, organizations, memberships, datasets, jobs,
    billing metadata, and audit events
-   S3-compatible object storage for original files and exports
-   Redis + BullMQ (Node workers) or a Python task queue for
    asynchronous processing; avoid running duplicate queues without a
    reason
-   Docker for reproducible development and deployment
-   Managed cloud hosting and managed PostgreSQL/object storage for the
    first production release
-   Monitoring, structured logs, error tracking, and backups from the
    beginning

### BI integration

-   Native charts for the core product UI
-   Optional Power BI embedding for customers who already use Power BI
-   Use Microsoft's supported embedding model and licensing; never
    expose client secrets in browser code
-   Secure every report and dataset per organization

### Later, only when justified

-   ClickHouse or a cloud warehouse for larger analytical workloads
-   dbt for managed SQL transformation projects
-   Kafka for high-volume event streaming
-   MLflow for experiment tracking and model registry
-   Kubernetes for workloads that justify orchestration
-   Feature store, vector database, and advanced model-serving
    infrastructure only when use cases require them

## 7. Main system architecture

``` text
Next.js web app
      |
      v
NestJS REST API  <----> PostgreSQL
      |                  users, tenants, roles,
      |                  datasets metadata, jobs,
      |                  billing, audit logs
      |
      +----> Object storage (uploaded files)
      |
      +----> Queue / background workers
                     |
                     v
              Python FastAPI service
              profiling / SQL analytics /
              statistics / ML / forecasts
                     |
                     v
              Processed data and model artifacts
                     |
                     v
              Results API --> charts, reports, alerts
```

Treat the diagram as a recommended architecture, not a requirement to
deploy every service separately on day one.

## 8. Features: MVP to advanced platform

### A. SaaS foundation

-   Sign up, login, logout, password reset, email verification
-   Organization/workspace creation
-   Invite teammates
-   Roles: owner, admin, analyst, viewer
-   Organization and project settings
-   Tenant isolation and access checks on every resource
-   Audit log for sensitive actions
-   Usage limits and plan entitlements

### B. Data ingestion

-   CSV and Excel upload
-   File-size and row limits by plan
-   File-type and content validation
-   Column names, types, null counts, unique counts and sample rows
-   Schema detection and duplicate detection
-   Missing-value and outlier summaries
-   Dataset versioning and upload history
-   Background processing with job status and retry
-   Data-source connectors: PostgreSQL, MySQL, REST APIs, Google Sheets,
    cloud warehouses---prioritized by customer demand
-   Scheduled syncs and incremental ingestion in later releases

### C. Data preparation

-   Type conversion
-   Missing-value handling suggestions
-   Duplicate removal preview
-   Column rename and filtering
-   Join datasets
-   Calculated columns and derived metrics
-   Validation rules
-   Reproducible transformation pipelines
-   Before/after preview and rollback/version history

### D. Descriptive analytics

-   Row and column counts
-   Summary statistics
-   Frequency distributions
-   Group-by and aggregation
-   Time-based comparisons
-   Correlation matrix
-   Trend and seasonality views
-   Histograms, bar charts, line charts, scatter plots, box plots and
    heatmaps
-   KPI cards, saved charts and dashboard layouts
-   Filters, drill-down and export to CSV/PDF
-   Metric definitions so the same KPI means the same thing across
    reports

### E. Diagnostic analytics

-   Period-over-period comparisons
-   Segment and cohort analysis
-   Contribution analysis
-   Funnel analysis where event data exists
-   Variance decomposition
-   Root-cause exploration with supporting evidence
-   Correlation must not be presented as proof of causation

### F. Predictive analytics and classical ML

-   Regression: Linear Regression, Ridge, Lasso, Random Forest, Gradient
    Boosting, CatBoost/LightGBM where appropriate
-   Classification: Logistic Regression, Decision Trees, Random Forest,
    Gradient Boosting
-   Clustering: K-Means, DBSCAN and hierarchical clustering
-   Anomaly detection: Isolation Forest and robust statistical rules
-   Forecasting: naive/seasonal baselines, exponential smoothing,
    ARIMA/SARIMA; advanced models later
-   Train/test split and cross-validation where appropriate
-   Baseline comparisons and task-appropriate metrics
-   Feature importance and supported explainability
-   Experiment history, model versioning and reproducible runs
-   Batch predictions and model performance monitoring

Do not show every algorithm for every dataset. Recommend algorithms
based on data type, target, dataset size, evaluation metric, runtime,
and interpretability.

### G. AI analyst

-   Ask questions in natural language
-   Generate SQL or analytical plans only through a controlled,
    validated layer
-   Answer using authorized datasets and verified query results
-   Explain KPI changes with supporting figures
-   Summarize dashboards and reports
-   Suggest charts and next analysis steps
-   Generate report drafts
-   Cite dataset, time period, filters, and calculations used
-   Refuse to answer when required data is absent or access is denied
-   Keep prompts, outputs, and sensitive data under appropriate
    retention and privacy policies

Never let an LLM execute arbitrary SQL against production systems with
unrestricted permissions. Use allowlisted operations, parameterized
queries, query limits, tenant scoping, and read-only credentials.

### H. Deep learning (later)

-   Text classification and sentiment analysis
-   Document extraction and classification
-   Image classification and defect detection
-   Sequence-based anomaly detection
-   More advanced time-series forecasting
-   Neural recommendations for suitable use cases
-   Embeddings and semantic search where justified

Deep learning is not automatically better than classical ML. Start with
pretrained models and establish a baseline before training or
fine-tuning large models.

### I. Prescriptive analytics and workflows

-   Threshold-based alerts
-   Anomaly notifications
-   Forecast-based warnings
-   Recommended follow-up analyses
-   Scheduled jobs and reports
-   Email and webhook notifications
-   Approval steps for consequential actions
-   Human review before actions that affect money, customers,
    employment, or operations

### J. Collaboration and reporting

-   Saved dashboards and reports
-   Share within an organization
-   Role-based sharing
-   Scheduled email reports
-   CSV/PDF exports
-   Comments and annotations
-   Dashboard templates
-   Optional branded/white-label reports on higher plans
-   Optional Power BI integration

### K. Admin, security and reliability

-   Organization-level access control
-   Row-level data access where applicable
-   Encryption in transit and at rest
-   Secret management
-   File scanning and resource limits
-   Rate limiting and abuse protection
-   Audit logs and retention settings
-   Backups and restore tests
-   Job retries and idempotency
-   Monitoring, alerting and incident procedures
-   Data deletion/export workflows
-   Privacy policy, terms, DPA and appropriate regulatory review
-   SSO/SAML/SCIM and enterprise governance when demanded

### L. Billing and monetization

-   Free trial or limited free tier
-   Paid monthly/annual plans
-   Plan limits on users, storage, rows, refreshes, compute, AI usage
    and ML runs
-   Usage meter and usage history
-   Payment provider integration
-   Subscription lifecycle, invoices and failed-payment handling
-   Upgrade/downgrade and cancellation flows
-   Admin view for customer usage and support
-   Optional paid onboarding, data connectors, and custom analytics
    services

## 9. Algorithm roadmap

Prioritize algorithms by business value and supportability rather than
the size of the catalog.

  -----------------------------------------------------------------------
  Category                Start with              Add when customers need
                                                  it
  ----------------------- ----------------------- -----------------------
  Statistics              Mean/median,            Hypothesis tests,
                          distributions,          robust statistics,
                          quantiles, confidence   Bayesian methods
                          intervals               

  Regression              Linear/Ridge, Random    CatBoost/LightGBM,
                          Forest, Gradient        quantile regression
                          Boosting                

  Classification          Logistic Regression,    Imbalanced-learning
                          Random Forest, Gradient methods, calibrated
                          Boosting                probabilities

  Clustering              K-Means                 DBSCAN, hierarchical
                                                  clustering, GMM

  Anomaly detection       Rules, robust z-scores, LOF, autoencoders,
                          Isolation Forest        change-point methods

  Forecasting             Naive baselines,        SARIMAX,
                          exponential smoothing,  gradient-boosted lag
                          ARIMA                   models, deep
                                                  forecasting

  Text                    Keyword/search and      Fine-tuned transformer
                          pretrained              models
                          classification APIs     

  Recommendations         Popularity and          Collaborative filtering
                          content-based baselines and learning-to-rank

  Deep learning           Pretrained              Fine-tuning, custom
                          text/document/image     neural architectures
                          models                  

  Optimization            Rules and constraints   Mathematical
                                                  optimization or
                                                  reinforcement learning
                                                  for proven use cases
  -----------------------------------------------------------------------

## 10. Database entities

Core application tables may include:

-   `users`
-   `organizations`
-   `memberships`
-   `projects`
-   `datasets`
-   `dataset_versions`
-   `data_sources`
-   `pipelines`
-   `pipeline_runs`
-   `jobs`
-   `dashboards`
-   `reports`
-   `experiments`
-   `model_versions`
-   `predictions`
-   `alerts`
-   `subscriptions`
-   `usage_records`
-   `api_keys`
-   `audit_logs`

Every tenant-owned resource should have an organization/tenant scope.
Enforce access in the backend and consider PostgreSQL row-level security
as an additional safeguard. Do not assume that a UUID or hidden frontend
field is authorization.

## 11. API design sketch

``` text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/me

POST   /api/v1/organizations
GET    /api/v1/organizations/:orgId
POST   /api/v1/organizations/:orgId/members

POST   /api/v1/datasets/upload
GET    /api/v1/datasets
GET    /api/v1/datasets/:datasetId
GET    /api/v1/datasets/:datasetId/profile
POST   /api/v1/datasets/:datasetId/transform

POST   /api/v1/analytics/summary
POST   /api/v1/analytics/query
POST   /api/v1/dashboards
GET    /api/v1/dashboards/:dashboardId

POST   /api/v1/ml/experiments
GET    /api/v1/ml/experiments/:experimentId
POST   /api/v1/models/:modelId/predict

POST   /api/v1/ai/chat
POST   /api/v1/reports
GET    /api/v1/jobs/:jobId

GET    /api/v1/billing/usage
POST   /api/v1/billing/checkout
POST   /api/v1/integrations/powerbi/embed-config
```

This is an initial contract sketch. Define validation, authorization,
pagination, errors, and idempotency for the endpoints before production.

## 12. Implementation roadmap

### Phase 0 --- Validate the business (1--2 weeks)

-   Interview 10--15 people in one target segment.
-   Ask how reports are made today, which decisions are slow, what data
    is available, and what mistakes cost.
-   Obtain anonymized sample datasets.
-   Build a landing page and clickable prototype.
-   Test pricing and request pilot commitments.
-   Define one measurable outcome, such as reducing weekly reporting
    time.

### Phase 1 --- SaaS foundation (weeks 1--3)

-   Set up repositories, linting, formatting, environment configuration
    and CI.
-   Build authentication and organization membership.
-   Add roles, tenant-scoped authorization and audit events.
-   Create PostgreSQL schema and migrations.
-   Add basic dashboard navigation and settings.
-   Add tests for cross-tenant access denial.

### Phase 2 --- Upload and profiling (weeks 3--5)

-   Build CSV/Excel upload and safe object storage.
-   Add file validation and size limits.
-   Process files asynchronously.
-   Show schema, missing values, duplicates, statistics and sample rows.
-   Show processing status and useful errors.
-   Add dataset version history.

### Phase 3 --- Analytics dashboard (weeks 5--7)

-   Add KPI summaries and common chart types.
-   Add filters, grouping, date ranges and export.
-   Save dashboard layouts.
-   Add definitions for key metrics.
-   Validate results against known sample calculations.

### Phase 4 --- Customer pilot (weeks 7--9)

-   Add one high-value connector requested by pilot customers.
-   Add scheduled refresh, access controls, audit logs and backups.
-   Measure activation, usage, report time saved and recurring usage.
-   Fix reliability and usability before expanding scope.

### Phase 5 --- Classical ML (weeks 9--12)

-   Add regression, classification, clustering, anomaly detection and
    baseline forecasting.
-   Add data leakage prevention, validation, task-specific metrics and
    baseline comparisons.
-   Track experiments and model versions.
-   Explain predictions and communicate uncertainty.
-   Run ML tasks in isolated background workers.

### Phase 6 --- AI analyst (weeks 12--14)

-   Build a controlled natural-language-to-analytics workflow.
-   Limit the assistant to authorized datasets and approved query
    operations.
-   Return answers with calculation details and evidence.
-   Test prompt injection, unauthorized access, misleading answers and
    missing-data cases.

### Phase 7 --- Monetization and production (weeks 14--16)

-   Add plan limits, usage metering, billing and subscription
    management.
-   Configure production deployment, observability, alerting, backups
    and restore drills.
-   Complete security review and data deletion/export flows.
-   Onboard paid pilot customers and measure retention.

### Phase 8 --- Advanced capabilities (after validation)

-   Power BI embedding and additional connectors
-   Deep learning and document intelligence
-   Advanced forecasting and recommendations
-   Enterprise SSO and governance
-   Warehouse integrations, higher-scale compute and multi-region
    options

These timings are illustrative and depend on team size, experience,
integrations, security requirements and scope. A smaller team should
prioritize the MVP rather than promise every phase on a fixed deadline.

## 13. How the SaaS can earn revenue

### Potential pricing model

Use value-based packaging with clear usage limits. Example prices below
are **hypotheses for customer interviews**, not market benchmarks or
guaranteed viable prices.

  ------------------------------------------------------------------------
  Plan                            Illustrative price Possible package
  --------------------- ---------------------------- ---------------------
  Free / Trial                                    ₹0 One workspace, small
                                                     upload limit, basic
                                                     profiling and a few
                                                     charts

  Starter                       ₹1,499--₹2,999/month Small-team
                                                     dashboards, more
                                                     datasets, scheduled
                                                     reports

  Growth                       ₹5,999--₹14,999/month More users,
                                                     connectors,
                                                     refreshes, alerts,
                                                     and selected ML runs

  Business                  Custom or ₹25,000+/month Higher limits,
                                                     advanced access
                                                     controls, governance,
                                                     priority support

  Implementation                         Fixed quote Data cleanup, custom
  services                                           connectors, dashboard
                                                     setup, onboarding
  ------------------------------------------------------------------------

### Monetization options

1.  **Subscription:** charge monthly or annually per workspace, user
    tier, or feature tier.
2.  **Usage-based billing:** charge for storage, processed rows,
    refreshes, compute time, AI tokens, or model runs, with transparent
    caps and alerts.
3.  **Enterprise plan:** offer SSO, governance, custom retention,
    support SLAs and higher capacity.
4.  **Paid setup:** charge for onboarding, data-source integration and
    custom dashboard configuration.
5.  **Premium analytics:** charge for specialized forecasts, document
    processing or domain-specific models.
6.  **Partner/agency tier:** support consultants managing reports for
    multiple client organizations.

### Unit economics to monitor

-   Monthly recurring revenue (MRR)
-   Customer acquisition cost (CAC)
-   Gross margin after cloud, data processing, AI, BI and support costs
-   Customer churn and retention
-   Activation rate and time to first useful insight
-   Cost per active workspace and per analysis
-   Trial-to-paid conversion
-   Expansion revenue and net revenue retention

Do not offer unlimited AI or compute on a low fixed price until actual
usage costs are measured. Add quotas, cost monitoring, abuse controls
and fair-use policies.

## 14. Go-to-market strategy

1.  Pick one industry and one buyer persona.
2.  Find 10--15 potential customers and observe their current reporting
    workflow.
3.  Build a demo using anonymized or synthetic data; do not expose
    client data.
4.  Offer a limited pilot tied to a measurable outcome.
5.  Charge for the pilot or agree on a clear conversion condition.
6.  Turn repeated customer requirements into product features; avoid
    one-off customization that cannot be reused.
7.  Publish focused case studies only with permission and truthful
    results.
8.  Acquire customers through direct outreach, industry communities,
    useful templates, integration partners and targeted content.
9.  Measure recurring usage and retention before scaling paid
    acquisition.

## 15. Security, privacy and trust principles

-   Isolate organizations in every API query, background job and
    object-storage operation.
-   Verify the caller's role and resource permissions server-side.
-   Use least-privilege database and cloud credentials.
-   Encrypt data in transit and at rest.
-   Never expose API keys, service-account credentials or Power BI
    client secrets in the browser.
-   Set upload limits and validate actual file content.
-   Protect against CSV formula injection in exported files.
-   Avoid logging raw customer data or secrets.
-   Provide deletion and export mechanisms.
-   Define retention, backup, incident response and support access
    policies.
-   Keep AI answers grounded in authorized data and explain when
    evidence is insufficient.
-   Obtain appropriate legal and privacy advice for each market and data
    category.

## 16. Success metrics

The MVP should prove customer value, not the number of algorithms
shipped.

-   Time from signup to first useful insight
-   Percentage of users who successfully upload/connect data
-   Percentage of workspaces that return weekly
-   Reports created and shared per active workspace
-   Time saved on recurring reporting
-   Accuracy and usefulness of analytics validated by customers
-   Number of paid pilot conversions
-   Gross margin and support time per customer
-   Reliability of ingestion and background jobs

## 17. What not to build first

Avoid spending the first release on: - Dozens of ML/DL algorithms before
customers validate the need - A generic drag-and-drop data warehouse
builder - Kafka/Kubernetes/microservices without a scale requirement - A
custom BI engine that duplicates mature tools - Unrestricted
natural-language SQL execution - Autonomous actions that can change
business systems without review - Many industry templates without one
proven use case

## 18. Recommended first release

Build this end-to-end workflow:

1.  User signs up and creates an organization.
2.  User uploads a CSV file.
3.  The system validates and profiles the dataset.
4.  The dashboard shows KPIs, quality warnings, distributions and
    trends.
5.  The user creates and saves a chart.
6.  The user asks a question and receives an evidence-backed answer.
7.  The user schedules or exports a report.
8.  The owner sees usage and can upgrade the plan.

Then pilot it with real businesses, measure value, and choose the next
feature from customer evidence.

## 19. Definition of done for the MVP

-   [ ] Authentication and organization membership work.
-   [ ] Tenant isolation is tested, including negative cross-tenant
    tests.
-   [ ] CSV upload is validated and processed asynchronously.
-   [ ] Dataset profiling and core charts produce correct results.
-   [ ] Dashboards can be saved and reopened.
-   [ ] Errors and job status are visible and actionable.
-   [ ] Audit logs, backups and data deletion are implemented.
-   [ ] Usage limits are enforced on the server.
-   [ ] At least three target customers have tested the product.
-   [ ] At least one measurable customer outcome and willingness-to-pay
    signal have been demonstrated.

------------------------------------------------------------------------

## Final product principle

**Do not sell "access to algorithms." Sell a repeatable business
outcome:** less time preparing reports, earlier detection of problems,
better forecasts, or clearer decisions. The algorithms and
infrastructure are the engine; customer trust, usability, measurable
value and retention are what make the SaaS sustainable.
