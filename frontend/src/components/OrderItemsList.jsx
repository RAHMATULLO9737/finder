import { Link } from 'react-router-dom';
import GiftImage from './GiftImage';
import { money } from '../utils';

export default function OrderItemsList({ items }) {
  return (
    <ul className="order-items">
      {items.map((i) => {
        const media = <GiftImage gift={{ id: i.gift || i.id, name: i.name, image_src: i.image_src, category_emoji: i.category_emoji }} />;
        return (
          <li key={i.id}>
            {i.gift ? <Link to={`/gifts/${i.gift}`} className="oi-thumb">{media}</Link> : <span className="oi-thumb">{media}</span>}
            <div className="oi-info">
              <b>{i.name}</b>
              <small className="muted">{money(i.price)} × {i.quantity}</small>
            </div>
            <strong>{money(i.subtotal)}</strong>
          </li>
        );
      })}
    </ul>
  );
}
