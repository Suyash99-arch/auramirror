import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="nav glass">
      <Link to="/" className="logo">✦ AuraMirror</Link>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
      </div>
      <Link to="/studio" className="btn btn-sm">Try Now</Link>
    </nav>
  );
}