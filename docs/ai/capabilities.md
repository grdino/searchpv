id: analyze_listings
version: 1

name:
  en: Analyze Listings
  es: Analizar Propiedades

description:
  en: >
    Returns active, pending, or closed listings using approved listing,
    geographic, price, property-type, and physical-characteristic filters.
  es: >
    Devuelve propiedades activas, pendientes o vendidas utilizando filtros
    aprobados de ubicación, precio, tipo y características.

availability:
  public: true
  office: true

supported_statuses:
  - Active
  - Pending
  - Closed

supported_property_types:
  - Condos
  - Houses

parameters:
  status:
    type: enum
    required: true
    values:
      - Active
      - Pending
      - Closed

  geography_ids:
    type: array
    items: integer
    required: false
    resolver: geographic_resolver

  property_types:
    type: array
    items: enum
    values:
      - Condos
      - Houses
    required: false

  min_price_usd:
    type: number
    minimum: 0
    required: false

  max_price_usd:
    type: number
    minimum: 0
    required: false

  min_bedrooms:
    type: number
    minimum: 0
    required: false

  min_bathrooms:
    type: number
    minimum: 0
    required: false

  pet_friendly:
    type: boolean
    required: false

  sort:
    type: enum
    values:
      - price_asc
      - price_desc
      - newest
      - oldest
      - dom_asc
      - dom_desc
    default: newest

  limit:
    type: integer
    minimum: 1
    maximum: 100
    default: 25

execution:
  type: function
  function_name: public.ai_analyze_listings

data_rules:
  - Active and Pending use the latest available inventory snapshot.
  - Closed uses sold date and requires a date range.
  - Pet-friendly must be null when the listing does not provide an answer.
  - Missing pet information must not be interpreted as pets prohibited.

default_behavior:
  missing_status: Active
  missing_currency: USD
  missing_language: detect_from_question

examples:
  - question: Show me active 2-bedroom condos in Versalles under $400,000.
    language: en
    parameters:
      status: Active
      geographic_query: Versalles
      property_types:
        - Condos
      min_bedrooms: 2
      max_price_usd: 400000

  - question: Muéstrame departamentos de dos recámaras en Versalles por menos de $400,000 dólares.
    language: es
    parameters:
      status: Active
      geographic_query: Versalles
      property_types:
        - Condos
      min_bedrooms: 2
      max_price_usd: 400000

unsupported:
  - Estimated future appreciation
  - Guaranteed rental income
  - Properties not present in SearchPV data