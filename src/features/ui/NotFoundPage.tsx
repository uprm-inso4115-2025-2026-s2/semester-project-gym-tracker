import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-body">
          This route doesn't exist. It might have been moved, deleted, or you
          may have typed the URL incorrectly.
        </p>
        <Link to="/" className="not-found-btn">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
