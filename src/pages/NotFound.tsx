import { Link } from 'react-router';
import PageHero from '../components/PageHero';

export default function NotFound() {
  return (
    <PageHero title="Page not found" subtitle="The page you were looking for doesn't exist or has moved.">
      <div className="btn-row">
        <Link to="/" className="btn btn-green">
          Back to home
        </Link>
        <Link to="/publications" className="btn btn-outline">
          Publications
        </Link>
      </div>
    </PageHero>
  );
}
