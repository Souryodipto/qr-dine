import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { menuApi, tablesApi, restaurantApi } from '../utils/api';
import {
  Store, Utensils, Grid3x3, QrCode, Plus, Minus, Trash2,
  ChevronRight, ChevronLeft, CheckCircle, Upload, Download
} from 'lucide-react';

const STEPS = [
  { icon: Store, label: 'Profile' },
  { icon: Utensils, label: 'Menu' },
  { icon: Grid3x3, label: 'Tables' },
  { icon: QrCode, label: 'QR Codes' },
];

const RESTAURANT_TYPES = ['Cafe', 'Fine Dining', 'Cloud Kitchen', 'Fast Food', 'Bar & Grill'];

export default function SetupWizard() {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Profile
  const [restaurantName, setRestaurantName] = useState(currentUser?.restaurantName || '');
  const [restaurantType, setRestaurantType] = useState('Cafe');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Step 2: Menu Categories (Backend style)
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');

  // Step 3: Tables
  const [tableCount, setTableCount] = useState(5);
  const [tableNamePrefix, setTableNamePrefix] = useState('Table');

  // Step 4: Finished
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (currentUser?.restaurantExists) {
      // If already has restaurant but in setup, maybe just load name
      setRestaurantName(currentUser.restaurantName);
    }
  }, [currentUser]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = async () => {
    setError('');
    if (currentStep === 0) {
      if (!restaurantName || !contactNumber || !address) {
        setError('Please fill all required fields.');
        return;
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('name', restaurantName);
        formData.append('type', restaurantType);
        formData.append('phone', contactNumber);
        formData.append('address', address);
        if (logo) formData.append('logo', logo);

        const updated = await restaurantApi.updateProfile(formData);
        // Refresh auth state to reflect restaurant existence
        if (updateProfile) updateProfile(updated);
        setCurrentStep(1);
      } catch (err) {
        setError(err.message || 'Failed to save profile.');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 1) {
      if (categories.length === 0) {
        setError('Please add at least one category.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setIsLoading(true);
      try {
        const result = await tablesApi.bulkCreateTables(tableCount, 1, tableNamePrefix);
        setTables(result.tables || []);
        setCurrentStep(3);
      } catch (err) {
        setError(err.message || 'Failed to create tables.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setIsLoading(true);
    try {
      const cat = await menuApi.createCategory(newCatName.trim());
      setCategories([...categories, cat]);
      setNewCatName('');
    } catch (err) {
      setError(err.message || 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const removeCategory = async (id) => {
    try {
      await menuApi.deleteCategory(id);
      setCategories(categories.filter(c => (c._id || c.id) !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Progress Header */}
      <div className="bg-white border-b border-border sticky top-[65px] z-30">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-black text-white' : isActive ? 'bg-black text-white' : 'bg-white border border-border text-muted'}`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase hidden sm:block ${isActive ? 'text-primary' : 'text-muted'}`}>{step.label}</span>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-[1px] mx-2 ${i < currentStep ? 'bg-black' : 'bg-border'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {error && (
          <div className="bg-danger/5 border border-danger/20 text-danger p-4 text-sm mb-6 font-medium">{error}</div>
        )}

        <div className="bg-white border border-border p-8 min-h-[400px]">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Step 1: Profile */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl heading-font font-bold mb-1">Restaurant Profile</h2>
                  <p className="text-muted text-sm mb-8">Tell us about your brand.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Restaurant Logo</label>
                  <label className="flex items-center justify-center gap-3 border border-dashed border-border py-8 px-4 cursor-pointer hover:border-primary transition bg-surface-alt group">
                    {logoPreview ? (
                      <div className="flex items-center gap-4">
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 object-cover border border-border" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Change Logo</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                        <span className="text-xs font-bold text-muted uppercase tracking-widest group-hover:text-primary transition-colors">Upload Logo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Restaurant Type</label>
                  <div className="flex flex-wrap gap-2">
                    {RESTAURANT_TYPES.map(type => (
                      <button key={type} onClick={() => setRestaurantType(type)} className={`px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase border transition ${restaurantType === type ? 'bg-black text-white border-black' : 'bg-white border-border text-muted hover:border-black hover:text-black'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Restaurant Name</label>
                  <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="input-premium" placeholder="e.g. The Urban Fork" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Contact Number</label>
                  <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="input-premium" placeholder="+91 9876543210" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="input-premium min-h-[100px] resize-none" placeholder="Full restaurant address" />
                </div>
              </div>
            )}

            {/* Step 2: Menu */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl heading-font font-bold mb-1">Menu Categories</h2>
                  <p className="text-muted text-sm mb-8">Add the main categories for your menu (e.g. Appetizers, Main Course, Drinks).</p>
                </div>

                <div className="flex gap-2">
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} className="input-premium flex-1" placeholder="Category name..." />
                  <button onClick={addCategory} disabled={isLoading || !newCatName.trim()} className="btn-primary !px-6">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-6">
                  {categories.map((cat, i) => (
                    <div key={cat._id || i} className="flex items-center justify-between p-4 border border-border bg-surface-alt">
                      <span className="font-bold text-xs tracking-widest uppercase">{cat.name}</span>
                      <button onClick={() => removeCategory(cat._id)} className="p-2 text-muted hover:text-danger transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-10 text-muted italic text-xs">No categories added yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Tables */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl heading-font font-bold mb-1">Tables Setup</h2>
                  <p className="text-muted text-sm mb-8">How many tables does your restaurant have? We'll generate a unique QR for each.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-4 text-center">Number of Tables: {tableCount}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="w-12 h-12 border border-border flex items-center justify-center hover:bg-black hover:text-white transition">
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-4xl font-black min-w-[60px] text-center">{tableCount}</span>
                    <button onClick={() => setTableCount(tableCount + 1)} className="w-12 h-12 border border-border flex items-center justify-center hover:bg-black hover:text-white transition">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Table Name Prefix</label>
                  <input type="text" value={tableNamePrefix} onChange={e => setTableNamePrefix(e.target.value)} className="input-premium" placeholder="e.g. Table" />
                </div>
              </div>
            )}

            {/* Step 4: Finished */}
            {currentStep === 3 && (
              <div className="text-center space-y-8">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-black flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl heading-font font-bold mb-2">Setup Complete!</h2>
                  <p className="text-muted text-sm px-6">Your restaurant is ready. Your {tableCount} table QR codes have been generated.</p>
                </div>

                <div className="bg-surface-alt border border-border p-6 text-left">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4 underline">Next Steps</p>
                  <ul className="text-xs space-y-3 font-medium">
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 bg-black rounded-full" />
                      Go to Dashboard to manage live orders.
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 bg-black rounded-full" />
                      Add items to your categories in the Menu tab.
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1 h-1 bg-black rounded-full" />
                      Download and print your QR codes.
                    </li>
                  </ul>
                </div>

                <button onClick={() => navigate('/owner/dashboard')} className="btn-primary w-full py-4 tracking-[0.2em]">
                  Go to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isLoading || currentStep === 0}
              className="px-6 py-3 text-[10px] font-bold tracking-widest uppercase text-muted hover:text-primary transition disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="btn-primary !py-3 !px-8 flex items-center gap-2 group"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Next <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
