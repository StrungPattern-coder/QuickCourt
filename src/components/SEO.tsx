import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  path?: string;
};

const SEO = ({ title, description = "Book local sports courts in real-time with QuickCourt.", path = "/" }: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="canonical" href={path} />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
  </Helmet>
);

export default SEO;
