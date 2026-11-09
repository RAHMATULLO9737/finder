import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import api, { errMsg } from '../api';
import GiftCard from '../components/GiftCard';
import { RECIPIENTS } from '../utils';

const BUDGETS = [
  { label: '100 000 so‘mgacha', max: 100000 },
  { label: '100 000 – 300 000', min: 100000, max: 300000 },
  { label: '300 000 – 700 000', min: 300000, max: 700000 },
  { label: '700 000 dan yuqori', min: 700000 },
  { label: 'Farqi yo‘q' },
];

export default function Finder() {
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState('any');
  const [age, setAge] = useState('');
  const [budget, setBudget] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const find = async (b) => {
    setBudget(b);
    setStep(3);
    setLoading(true);
    setError('');
    const params = { ordering: '-avg_rating', page_size: 6 };
    if (recipient !== 'any') params.recipient = recipient;
    if (age) params.age = age;
    if (b?.min) params.min_price = b.min;
    if (b?.max) params.max_price = b.max;
    try {
      setResults((await api.get('/gifts/', { params })).data.results);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const restart = () => { setStep(0); setRecipient('any'); setAge(''); setBudget(null); setResults([]); };

  return (
    <div className="container page-section">
      <div className="section-heading center">
        <div><span className="eyebrow">SOVG‘A TOPUVCHI</span><h2>Sizga mos sovg‘ani topamiz</h2>
          <p>Faqat 3 ta savol — va eng yaxshi tavsiyalar tayyor.</p></div>
      </div>

      {step < 3 && (
        <div className="wizard">
          <div className="wizard-progress">{[0, 1, 2].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>

          {step === 0 && (
            <>
              <h3>1. Sovg‘a kim uchun?</h3>
              <div className="choice-grid">
                {RECIPIENTS.map(([value, label, emoji]) => (
                  <button key={value} className={'choice' + (recipient === value ? ' selected' : '')} onClick={() => { setRecipient(value); setStep(1); }}>
                    <span>{emoji}</span>{label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3>2. Uning yoshi nechada?</h3>
              <input className="big-input" type="number" min="0" max="120" placeholder="Masalan, 25" value={age} onChange={(e) => setAge(e.target.value)} autoFocus />
              <div className="wizard-nav">
                <button className="btn btn-light" onClick={() => setStep(0)}><ArrowLeft size={16} /> Orqaga</button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>{age ? 'Keyingisi' : 'O‘tkazib yuborish'} <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3>3. Byudjetingiz qancha?</h3>
              <div className="choice-grid">
                {BUDGETS.map((b) => <button key={b.label} className="choice" onClick={() => find(b)}>{b.label}</button>)}
              </div>
              <div className="wizard-nav"><button className="btn btn-light" onClick={() => setStep(1)}><ArrowLeft size={16} /> Orqaga</button></div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <>
          <div className="result-head">
            <h3>Sizga tavsiyalar {budget?.label && budget.label !== 'Farqi yo‘q' ? `· ${budget.label}` : ''}</h3>
            <button className="btn btn-light" onClick={restart}><RotateCcw size={15} /> Qaytadan</button>
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? <div className="empty">Qidirilmoqda...</div> : results.length ? (
            <div className="gift-grid">{results.map((g) => <GiftCard key={g.id} gift={g} />)}</div>
          ) : <div className="empty">Afsuski, mos sovg‘a topilmadi. Byudjet yoki yoshni o‘zgartirib ko‘ring.</div>}
        </>
      )}
    </div>
  );
}
