import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          Fernweh<span className="brand-mark">.</span>
        </Link>
        <nav className="nav-links">
          <Link to="/cart" className="cart-chip">
            Cart · {cart.itemCount}
          </Link>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <span>{user.firstName}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
