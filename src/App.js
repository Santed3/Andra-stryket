import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, User, Search, Filter, ShoppingCart, Palette, Download, Clock, Star, Plus, 
  MessageCircle, Edit, Trash2, MapPin, Truck, CreditCard, Smartphone, Package, 
  Home, Settings, LogOut, ArrowLeft, Info, Users, Leaf, Mail, Lock, Eye, EyeOff
} from 'lucide-react';

// SUPABASE CONFIGURATION
const supabaseUrl = 'https://fzhbpuwqxruolydgmopg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aGJwdXdxeHJ1b2x5ZGdtb3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzQzNjcsImV4cCI6MjA3NTkxMDM2N30.H8aGcRkSO_b_XSjX6Udx6K_HGJglS02GfGDS_dU8Eow';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock NCS colors for color picker
const MOCK_NCS_COLORS = [
  { code: 'S 0502-Y', rgb: [250, 245, 225], hex: '#FAF5E1', lab: [96.23, -2.14, 10.56] },
  { code: 'S 1002-Y', rgb: [245, 240, 215], hex: '#F5F0D7', lab: [94.12, -1.87, 12.34] },
  { code: 'S 1010-Y10R', rgb: [255, 240, 210], hex: '#FFF0D2', lab: [95.67, 5.23, 25.67] },
  { code: 'S 1020-Y10R', rgb: [255, 220, 180], hex: '#FFDCB4', lab: [90.45, 12.67, 35.89] },
  { code: 'S 2002-Y', rgb: [240, 230, 200], hex: '#F0E6C8', lab: [90.23, -3.45, 15.67] },
];

const calculateDeltaE = (lab1, lab2) => {
  const deltaL = lab1[0] - lab2[0];
  const deltaA = lab1[1] - lab2[1];
  const deltaB = lab1[2] - lab2[2];
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

const rgbToLab = (rgb) => {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) * 100;
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) * 100;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) * 100;
  const xn = x / 95.047;
  const yn = y / 100.000;
  const zn = z / 108.883;
  const fx = xn > 0.008856 ? Math.pow(xn, 1/3) : (7.787 * xn) + (16/116);
  const fy = yn > 0.008856 ? Math.pow(yn, 1/3) : (7.787 * yn) + (16/116);
  const fz = zn > 0.008856 ? Math.pow(zn, 1/3) : (7.787 * zn) + (16/116);
  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b_val = 200 * (fy - fz);
  return [l, a, b_val];
};

const findClosestNCSColor = (rgb) => {
  const lab = rgbToLab(rgb);
  let closestColor = null;
  let minDeltaE = Infinity;
  const matches = [];
  MOCK_NCS_COLORS.forEach(color => {
    const deltaE = calculateDeltaE(lab, color.lab);
    matches.push({ ...color, deltaE });
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      closestColor = { ...color, deltaE };
    }
  });
  const top3 = matches.sort((a, b) => a.deltaE - b.deltaE).slice(0, 3);
  return { closestColor, top3 };
};

const ColorPicker = ({ image, onColorSelect }) => {
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = Math.min(img.width, 500);
        canvas.height = (img.height * canvas.width) / img.width;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = image;
    }
  }, [image]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const rgb = [pixel[0], pixel[1], pixel[2]];
    setSelectedColor(rgb);
    setSelectedPoint({ x, y });
    onColorSelect(rgb);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="max-w-full h-auto border border-gray-300 rounded-lg cursor-crosshair"
        style={{ maxHeight: '400px' }}
      />
      {selectedPoint && (
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
          style={{
            left: selectedPoint.x - 8,
            top: selectedPoint.y - 8,
            boxShadow: '0 0 0 2px #000'
          }}
        />
      )}
    </div>
  );
};

const ColorResult = ({ color, deltaE, isClosest = false }) => {
  return (
    <div className={`p-4 rounded-lg border ${isClosest ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center gap-4 mb-3">
        <div
          className="w-16 h-16 rounded border border-gray-300"
          style={{ backgroundColor: `rgb(${color.rgb.join(',')})` }}
        />
        <div
          className="w-16 h-16 rounded border border-gray-300"
          style={{ backgroundColor: color.hex }}
        />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-gray-800">{color.code}</div>
        <div className="text-sm text-gray-600">HEX: {color.hex}</div>
        {isClosest && (
          <div className="text-sm text-blue-600 font-medium">
            ΔE: {deltaE.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

// Authentication Components
const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Get user profile
        const {  profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        onAuthSuccess({ ...data.user, ...profileData });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
             {
              full_name: fullName,
            },
          },
        });
        
        if (error) throw error;
        
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            avatar_url: `https://placehold.co/80x80/6366f1/white?text=${fullName.charAt(0).toUpperCase()}`,
            location: ''
          });
          
        if (profileError) throw profileError;
        
        onAuthSuccess({ ...data.user, full_name: fullName });
      }
    } catch (err) {
      setError(err.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Ange din e-postadress');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      alert('Ett återställningsmeddelande har skickats till din e-post!');
    } catch (err) {
      setError(err.message || 'Kunde inte skicka återställningslänk');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isLogin ? 'Logga in' : 'Skapa konto'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fullständigt namn *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lösenord *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-800 text-sm text-right w-full"
            >
              Glömt lösenord?
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Bearbetar...' : (isLogin ? 'Logga in' : 'Skapa konto')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isLogin ? 'Har du inget konto? Skapa ett' : 'Har du redan ett konto? Logga in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('marketplace');
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const {  { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user profile
        const {  profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setUser({ ...session.user, ...profileData });
      }
      setLoading(false);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const {  { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const {  profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser({ ...session.user, ...profileData });
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch data when user is authenticated
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Fetch listings
        const {  listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            seller:profiles(*)
          `)
          .order('created_at', { ascending: false });
        
        if (!listingsError) {
          setListings(listingsData || []);
        }
        
        // Fetch chats
        const {  chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            *,
            messages:messages(order:created_at),
            other_user:profiles!foreign_key(*)
          `)
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          .order('updated_at', { ascending: false });
        
        if (!chatsError) {
          setChats(chatsData || []);
        }
      } else {
        // Fetch public listings
        const {  listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            seller:profiles(*)
          `)
          .order('created_at', { ascending: false });
        
        if (!listingsError) {
          setListings(listingsData || []);
        }
      }
    };
    
    if (!loading) {
      fetchData();
    }
  }, [user, loading]);

  const handleLogin = async (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('marketplace');
  };

  const handleCreateListing = async (listingData) => {
    if (!user) return;
    
    // Calculate coverage
    let coverage = "0 m²";
    const volumeNum = parseFloat(listingData.volume);
    if (volumeNum) {
      coverage = `${(volumeNum * 10).toFixed(0)}-${(volumeNum * 12).toFixed(0)} m²`;
    }

    const { data, error } = await supabase
      .from('listings')
      .insert([{
        ...listingData,
        seller_id: user.id,
        price: parseInt(listingData.price),
        images: ["https://placehold.co/600x400/f5f5dc/6366f1?text=Sample"],
        coverage,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      setListings([data, ...listings]);
    }
    
    setShowCreateListingModal(false);
  };

  const handleBuy = (listing) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedListing(listing);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    alert('Betalning genomförd! Pengarna hålls inne tills du bekräftar mottagandet.');
    setShowPaymentModal(false);
    setSelectedListing(null);
  };

  const handleViewListing = (listing) => {
    setSelectedListing(listing);
    setCurrentPage('listing-detail');
  };

  const handleChat = async (listing) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.listing_id === listing.id && 
      ((chat.participant_1 === user.id && chat.participant_2 === listing.seller.id) ||
       (chat.participant_2 === user.id && chat.participant_1 === listing.seller.id))
    );
    
    if (existingChat) {
      setCurrentChat(existingChat);
      setCurrentPage('chat');
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          participant_1: user.id,
          participant_2: listing.seller.id,
          listing_id: listing.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (!error && data) {
        setCurrentChat(data);
        setChats([data, ...chats]);
        setCurrentPage('chat');
      }
    }
  };

  const handleSendMessage = async (message) => {
    if (currentChat && user) {
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChat.id,
          sender_id: user.id,
          content: message.text,
          created_at: message.timestamp
        }]);
        
      if (!error) {
        // Update chat timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentChat.id);
          
        // Refresh chats
        const {  chatsData } = await supabase
          .from('chats')
          .select(`
            *,
            messages:messages(order:created_at),
            other_user:profiles!foreign_key(*)
          `)
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          .order('updated_at', { ascending: false });
          
        setChats(chatsData || []);
        setCurrentChat(chatsData.find(c => c.id === currentChat.id) || currentChat);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  // Rest of the components (CreateListingModal, PaymentModal, ProfilePage, etc.)
  // would be implemented similarly with Supabase calls

  const renderPage = () => {
    // This would include all the page rendering logic with proper Supabase integration
    // For brevity, I'm showing the basic structure
    
    if (currentPage === 'marketplace') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Marknad</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm p-6 cursor-pointer"
                   onClick={() => handleViewListing(listing)}>
                <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                <p className="text-gray-600 mt-2">{listing.price} kr</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {currentPage === 'colormeter' ? 'Kulörmätare' : 
           currentPage === 'about' ? 'Om oss' : 'Andra Stryket'}
        </h1>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentPage('marketplace')}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                Andra Stryket
              </button>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button 
                    onClick={() => setCurrentPage('profile')}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <img
                      src={user.avatar_url || "https://placehold.co/40x40/6366f1/white?text=?"}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden sm:inline text-sm font-medium">{user.full_name}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Logga in
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        {renderPage()}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleLogin}
      />
    </div>
  );
};

export default App;
