interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Injects schema.org structured data as JSON-LD. Renders nothing when the
 * data is empty so dynamic routes can skip it entirely.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (Array.isArray(data) && data.length === 0) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
