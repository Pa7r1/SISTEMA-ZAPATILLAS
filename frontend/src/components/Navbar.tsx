import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex gap-4">
      <Link to="/" className="text-blue-600 font-semibold hover:underline">
        Inicio
      </Link>
      <Link
        to="/productos"
        className="text-blue-600 font-semibold hover:underline"
      >
        Productos
      </Link>
    </nav>
  );
}

export default Navbar;
