import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Form State
  const [formData, setFormData] = useState({ 
    id: '', name: '', price: '', quantity: '', category: '' 
  });

  // 1. Fetch Data
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://sivvarajainventory.onrender.com/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Form Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- NEW: Quantity Adjusters ---
  const increaseQty = () => {
    setFormData(prev => ({ ...prev, quantity: Number(prev.quantity || 0) + 1 }));
  };

  const decreaseQty = () => {
    setFormData(prev => ({ 
      ...prev, 
      quantity: Math.max(0, Number(prev.quantity || 0) - 1) // Prevent negative stock
    }));
  };
  // -------------------------------

const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Convert numbers to ensure backend accepts them
      const payload = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity)
      };

      if (view === 'add') {
        await axios.post('https://sivvarajainventory.onrender.com/api/products', payload);
      } else if (view === 'edit') {
        console.log("Updating ID:", formData.id); // Debug check
        await axios.put(`https://sivvarajainventory.onrender.com/api/products/${formData.id}`, payload);
      }
      
      fetchProducts();
      setView('list'); 
    } catch (err) {
      console.error("Save Failed:", err);
      alert("Error saving product. See console.");
    }
  };

const handleDelete = async (id) => {
    // Debugging: Check if ID is actually being passed
    console.log("Attempting to delete ID:", id); 

    if (window.confirm('Delete this product?')) {
      try {
        await axios.delete(`https://sivvarajainventory.onrender.com/api/products/${id}`);
        alert("Product Deleted Successfully!"); // Optional: Feedback
        fetchProducts(); // Refresh the list
      } catch (err) {
        console.error("Delete Failed:", err);
        alert("Failed to delete. Check console for details.");
      }
    }
  };

const startEdit = (product) => {
    // Debugging: Make sure product has an _id before setting state
    if (!product._id) {
      alert("Error: This product has no ID!");
      return;
    }

    setFormData({
      id: product._id, // Ensure this maps _id to id
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category
    });
    setView('edit');
  };

  const startAdd = () => {
    setFormData({ id: '', name: '', price: '', quantity: '', category: '' });
    setView('add');
  };

  // 3. Logic: Group Products
  const getVisibleProducts = () => {
    if (filterCategory === 'All') return products;
    return products.filter(p => p.category === filterCategory);
  };

  const groupedProducts = getVisibleProducts().reduce((groups, product) => {
    const cat = product.category || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(product);
    return groups;
  }, {});

  const categories = [...new Set(products.map(p => p.category || 'General'))];

  // --- RENDER VIEWS ---

  // VIEW 1: FORM (Add/Edit)
  if (view === 'add' || view === 'edit') {
    return (
      <div className="container mt-5" style={{ maxWidth: '600px' }}>
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">{view === 'add' ? 'Add New Product' : 'Update Product'}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label fw-bold">Name</label>
                <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Price (₹)</label>
                  <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required />
                </div>
                
                {/* --- NEW QUANTITY SELECTOR --- */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Quantity</label>
                  <div className="input-group">
                    <button type="button" className="btn btn-outline-danger" onClick={decreaseQty}>
                      <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>-</span>
                    </button>
                    
                    <input 
                      type="number" 
                      name="quantity" 
                      className="form-control text-center fw-bold" 
                      value={formData.quantity} 
                      onChange={handleChange} 
                      required 
                    />
                    
                    <button type="button" className="btn btn-outline-success" onClick={increaseQty}>
                      <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>+</span>
                    </button>
                  </div>
                </div>
                {/* ----------------------------- */}

              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Category</label>
                <input type="text" name="category" className="form-control" value={formData.category} onChange={handleChange} required />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success w-100 fw-bold">
                  {view === 'add' ? 'Save Product' : 'Update Product'}
                </button>
                <button type="button" className="btn btn-secondary w-100" onClick={() => setView('list')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: MAIN DASHBOARD
  return (
    <div className="container mt-4">
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h1 className="h2 text-dark">
           Shop Inventory
        </h1>
        <button className="btn btn-success fw-bold px-4" onClick={startAdd}>
          + Add New Product
        </button>
      </div>

      {/* FILTER SECTION */}
      <div className="row mb-4">
        <div className="col-md-12 d-flex justify-content-end align-items-center">
           <label className="me-2 fw-bold text-muted">Filter Category:</label>
           <select 
              className="form-select w-auto border-secondary" 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">Show All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
        </div>
      </div>

      {/* EMPTY STATE */}
      {Object.keys(groupedProducts).length === 0 && (
        <div className="alert alert-info text-center">
          No products found. Click "Add New Product" to start!
        </div>
      )}

      {/* PRODUCT LISTS */}
      {Object.keys(groupedProducts).map(category => (
        <div key={category} className="card mb-4 shadow-sm border-0">
          <div className="card-header bg-light border-bottom fw-bold text-uppercase text-secondary">
            {category}
          </div>
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{width: '40%'}}>Name</th>
                  <th style={{width: '20%'}}>Price</th>
                  <th style={{width: '20%'}}>Quantity</th>
                  <th style={{width: '20%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedProducts[category].map(product => (
                  <tr key={product._id} className="align-middle">
                    <td className="fw-medium">{product.name}</td>
                    <td className="text-success fw-bold">₹{product.price}</td>
                    <td>
                      <span className={`badge ${product.quantity < 5 ? 'bg-danger' : 'bg-secondary'}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => startEdit(product)} className="btn btn-outline-primary btn-sm me-2">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="btn btn-outline-danger btn-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;