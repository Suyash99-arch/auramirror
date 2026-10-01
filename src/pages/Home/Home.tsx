import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import FloatingCards from "./FloatingCards";
import "./Home.css";

const features = [
  { icon: "🖐️", title: "Hand gesture control", text: "Move your finger to point, pinch to select, swipe to scroll. No mouse, no keyboard." },
  { icon: "🎯", title: "Face-locked accessories", text: "Glasses, caps and chains follow your face and stay exactly where they belong." },
  { icon: "💄", title: "Makeup and hair", text: "Try eyeliner, bindis and hairstyles floating right next to you." },
  { icon: "📸", title: "Capture and share", text: "Hold a peace sign for one second to snap your look." },
];

const steps = [
  { n: "01", title: "Open the studio", text: "Allow camera access and your mirror comes alive." },
  { n: "02", title: "Point and pinch", text: "Hover a floating accessory with your finger and pinch to wear it." },
  { n: "03", title: "Swipe and explore", text: "Open palm swipes scroll through hundreds of styles." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="home">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <Navbar />

      <header className="hero">
        <FloatingCards />
        <div className="hero-content">
          <motion.span
            className="pill glass"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🤏 Controlled entirely by your hands
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
          >
            Try it on.<br />
            <span className="grad">Without touching anything.</span>
          </motion.h1>

          <motion.p
            className="sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            A virtual mirror where glasses, caps, chains, makeup and hairstyles float
            beside you. Pick them with a pinch.
          </motion.p>

          <motion.div
            className="cta-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/studio" className="btn">Open the Studio →</Link>
            <a href="#how" className="btn btn-ghost">See how it works</a>
          </motion.div>
        </div>
      </header>

      <section id="features" className="section">
        <h2 className="section-title">Everything you need to <span className="grad">style yourself</span></h2>
        <div className="grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card glass"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <div className="card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="section">
        <h2 className="section-title">Three steps. <span className="grad">Zero clicks.</span></h2>
        <div className="grid grid-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              className="card glass"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
            >
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section final">
        <h2 className="section-title">Ready to see <span className="grad">yourself differently?</span></h2>
        <Link to="/studio" className="btn">Launch AuraMirror</Link>
        <footer>© 2026 AuraMirror. Built with React, Three.js and MediaPipe.</footer>
      </section>
    </div>
  );
}