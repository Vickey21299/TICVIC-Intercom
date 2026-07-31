import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      {/* Animated background */}
      <div className="hero-bg">
        <div className="hero-gradient" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid" />
      </div>

      {/* Floating decorative cards */}
      <div className="hero-floating-cards">
        <div className="hero-float-card hero-float-card-1">
          <div className="float-card-circle" />
          <div className="float-card-line" />
          <div className="float-card-line" />
        </div>
        <div className="hero-float-card hero-float-card-2">
          <div className="float-card-circle" />
          <div className="float-card-line" />
          <div className="float-card-line" />
          <div className="float-card-line" />
        </div>
        <div className="hero-float-card hero-float-card-3">
          <div className="float-card-circle" />
          <div className="float-card-line" />
        </div>
      </div>

      {/* Content */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          New Collection 2026
        </div>
        <h1 className="hero-title">
          Discover the Future of{' '}
          <span className="hero-title-accent">Premium Design</span>
        </h1>
        <p className="hero-subtitle">
          Crafted with precision. Delivered with care. Experience products that
          redefine what's possible.
        </p>
        <div className="hero-buttons">
          <button className="hero-btn-primary">Shop Now</button>
          <button className="hero-btn-secondary">
            Learn More
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
