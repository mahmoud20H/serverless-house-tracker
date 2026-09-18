import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, Filter, X, Check, AlertTriangle, Loader2, Star } from 'lucide-react';
import { apiFetch } from './api.js';

const STATUSES = ['INBOX', 'VERIFIED', 'VISITED', 'DECISION'];
const PRICE_TIERS = {
  'UNDER_2M_NO_INSTALLMENTS': 'Under 2M - No Installments',
  'UNDER_2M_WITH_INSTALLMENTS': 'Under 2M - With Installments',
  'UNDER_3M_NO_INSTALLMENTS': 'Under 3M - No Installments',
  'UNDER_3M_WITH_INSTALLMENTS': 'Under 3M - With Installments',
  'HIGHER_3M': 'Higher than 3M',
  'RENTAL_10_15': 'Rental between 10 - 15',
  'RENTAL_15_20': 'Rental between 15 - 20',
  'RENTAL_ABOVE_20': 'Rental above 20'
};

const PRO_TAGS = ['Quiet', 'Near Metro', 'New Build', 'Good View'];
const CON_TAGS = ['No Elevator', 'Noisy Street', 'Far from center', 'Needs Renovation', 'Expensive Maintenance', 'High Floor'];
const COMMON_DISTRICTS = ['Maadi', 'Mohandseen', 'Haram', 'October', 'H alahram', 'Nasr city', 'Zayed'];

export default function App() {
  const [houses, setHouses] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistricts, setFilterDistricts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRating, setFilterRating] = useState('');
  
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setGlobalError(null);
        
        const [housesRes, brokersRes] = await Promise.all([
          apiFetch('/houses'),
          apiFetch('/brokers')
        ]);

        if (!housesRes.ok || !brokersRes.ok) {
          throw new Error('Failed to fetch data from backend');
        }

        const housesData = await housesRes.json();
        const brokersData = await brokersRes.json();

        setHouses(housesData);
        setBrokers(brokersData);
      } catch (err) {
        console.error("Fetch error:", err);
        setGlobalError("Could not connect to backend api. Ensure docker-compose and the node server are running.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleStatusToggle = async (houseId, currentStatus) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    const nextStatus = STATUSES[(currentIndex + 1) % STATUSES.length];
    
    setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, status: nextStatus } : h));
    
    try {
      const res = await apiFetch(`/houses/${houseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      console.error(err);
      setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, status: currentStatus } : h));
      alert("Failed to update status. Server error.");
    }
  };

  const handleRatingChange = async (houseId, currentRating, newRating) => {
    if (currentRating === newRating) return;
    setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, my_rating: newRating } : h));
    try {
      const res = await apiFetch(`/houses/${houseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ my_rating: newRating })
      });
      if (!res.ok) throw new Error('Failed to update rating');
    } catch (err) {
      console.error(err);
      setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, my_rating: currentRating } : h));
      alert("Failed to update rating. Server error.");
    }
  };

  const handleNotesChange = async (houseId, currentNotes, newNotes) => {
    if (currentNotes === newNotes) return;
    setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, notes: newNotes } : h));
    try {
      const res = await apiFetch(`/houses/${houseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes })
      });
      if (!res.ok) throw new Error('Failed to update notes');
    } catch (err) {
      console.error(err);
      setHouses(houses.map(h => (h.id === houseId || h.property_id === houseId) ? { ...h, notes: currentNotes } : h));
      alert("Failed to update notes. Server error.");
    }
  };

  const filteredHouses = houses.filter(h => {
    const title = h.title || '';
    const district = h.district || '';
    const rating = h.my_rating || 3;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistricts.length > 0 ? filterDistricts.includes(district) : true;
    const matchesStatus = filterStatus ? h.status === filterStatus : true;
    const matchesRating = filterRating ? rating.toString() === filterRating : true;
    return matchesSearch && matchesDistrict && matchesStatus && matchesRating;
  });

  const getBroker = (id) => brokers.find(b => b.id === id || b.broker_id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Error Alert */}
        {globalError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold text-sm">Connection Error</h3>
              <p className="text-red-600 text-sm mt-1">{globalError}</p>
            </div>
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Find House</h1>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Data
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search titles..." 
                className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Multi-select for Districts */}
            <div className="relative">
              <button 
                onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
              >
                Districts ({filterDistricts.length === 0 ? 'All' : filterDistricts.length})
              </button>
              {showDistrictDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDistrictDropdown(false)}></div>
                  <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-slate-200 shadow-lg rounded-lg p-2 z-20 max-h-60 overflow-y-auto">
                    {COMMON_DISTRICTS.map(d => (
                      <label key={d} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm">
                        <input 
                          type="checkbox" 
                          checked={filterDistricts.includes(d)}
                          onChange={(e) => {
                            if (e.target.checked) setFilterDistricts([...filterDistricts, d]);
                            else setFilterDistricts(filterDistricts.filter(fd => fd !== d));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
            >
              <option value="">All Ratings</option>
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>

            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!!globalError}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title & Link</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Price Tier</th>
                <th className="px-4 py-3 font-medium w-32">Status Workflow</th>
                <th className="px-4 py-3 font-medium">My Rating</th>
                <th className="px-4 py-3 font-medium w-48">Notes</th>
                <th className="px-4 py-3 font-medium">Pros</th>
                <th className="px-4 py-3 font-medium">Cons</th>
                <th className="px-4 py-3 font-medium">Broker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHouses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">No properties found.</td>
                </tr>
              ) : filteredHouses.map((house) => {
                const houseId = house.id || house.property_id;
                const rating = house.my_rating || 3;
                return (
                <tr key={houseId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{house.title}</span>
                      {house.link && (
                        <a href={house.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{house.district}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {PRICE_TIERS[house.price_tier] || house.price_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleStatusToggle(houseId, house.status)}
                      className={`w-full flex items-center justify-center px-2 py-1 rounded text-xs font-bold tracking-wider transition-colors
                        ${house.status === 'INBOX' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : ''}
                        ${house.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                        ${house.status === 'VISITED' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}
                        ${house.status === 'DECISION' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}
                      `}
                    >
                      {house.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 cursor-pointer transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                          onClick={() => handleRatingChange(houseId, rating, star)}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      className="w-full text-xs p-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded transition-colors resize-y min-h-[36px]"
                      defaultValue={house.notes || ''}
                      onBlur={(e) => handleNotesChange(houseId, house.notes || '', e.target.value)}
                      placeholder="Add notes..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(house.pros || []).map(pro => (
                        <span key={pro} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] uppercase font-bold tracking-wide">
                          {pro}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(house.cons || []).map(con => (
                        <span key={con} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] uppercase font-bold tracking-wide">
                          {con}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {house.broker_id ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{getBroker(house.broker_id)?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{getBroker(house.broker_id)?.phone || ''}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddPropertyModal 
          onClose={() => setIsModalOpen(false)} 
          brokers={brokers}
          onAdd={house => {
            setHouses([...houses, house]);
            setIsModalOpen(false);
          }}
          onAddBroker={broker => setBrokers([...brokers, broker])}
        />
      )}
    </div>
  );
}

// Sub-component for the Modal
function AddPropertyModal({ onClose, brokers, onAdd, onAddBroker }) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [district, setDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [priceTier, setPriceTier] = useState('UNDER_2M_NO_INSTALLMENTS');
  const [selectedPros, setSelectedPros] = useState([]);
  const [selectedCons, setSelectedCons] = useState([]);
  const [brokerId, setBrokerId] = useState('');
  const [notes, setNotes] = useState('');
  const [myRating, setMyRating] = useState(3);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mini broker form state
  const [showBrokerForm, setShowBrokerForm] = useState(false);
  const [brokerName, setBrokerName] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerReliability, setBrokerReliability] = useState('AVERAGE');
  const [isSubmittingBroker, setIsSubmittingBroker] = useState(false);

  const handleSave = async () => {
    const finalDistrict = district === 'CUSTOM' ? customDistrict : district;
    if (!title || !finalDistrict) return alert("Title and District are required");

    const payload = {
      title,
      link,
      district: finalDistrict,
      price_tier: priceTier,
      status: 'INBOX',
      pros: selectedPros,
      cons: selectedCons,
      broker_id: brokerId || null,
      notes: notes,
      my_rating: myRating
    };

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add property');
      const savedHouse = await res.json();
      onAdd(savedHouse);
    } catch (err) {
      console.error(err);
      alert("Error adding property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBroker = async () => {
    if(!brokerName || !brokerPhone) return;
    
    setIsSubmittingBroker(true);
    try {
      const res = await apiFetch('/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brokerName, phone: brokerPhone, reliability: brokerReliability })
      });
      if (!res.ok) throw new Error('Failed to add broker');
      const savedBroker = await res.json();
      
      onAddBroker(savedBroker);
      setShowBrokerForm(false);
      setBrokerName(''); setBrokerPhone(''); setBrokerReliability('AVERAGE');
    } catch (err) {
      console.error(err);
      alert("Error adding broker");
    } finally {
      setIsSubmittingBroker(false);
    }
  };

  const toggleTag = (tag, list, setList) => {
    if (list.includes(tag)) setList(list.filter(t => t !== tag));
    else setList([...list, tag]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-semibold text-slate-800">Add New Property</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Title & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sunny Apartment..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Link</label>
              <input type="text" value={link} onChange={e=>setLink(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
            </div>
          </div>

          {/* District Quick Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">District</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_DISTRICTS.map(d => (
                <button 
                  key={d} 
                  onClick={() => setDistrict(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${district === d ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {d}
                </button>
              ))}
              <button 
                onClick={() => setDistrict('CUSTOM')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${district === 'CUSTOM' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Other
              </button>
            </div>
            {district === 'CUSTOM' && (
              <input type="text" value={customDistrict} onChange={e=>setCustomDistrict(e.target.value)} className="mt-2 w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Type district name..." autoFocus />
            )}
          </div>

          {/* Price Tier Button Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Tier</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(PRICE_TIERS).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${priceTier === key ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${priceTier === key ? 'border-indigo-600' : 'border-slate-300'}`}>
                    {priceTier === key && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${priceTier === key ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= myRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                    onClick={() => setMyRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
              <textarea 
                value={notes} 
                onChange={e=>setNotes(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y" 
                placeholder="Any observations..." 
              />
            </div>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Pros</label>
              <div className="flex flex-wrap gap-2">
                {PRO_TAGS.map(tag => {
                  const isActive = selectedPros.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      onClick={() => toggleTag(tag, selectedPros, setSelectedPros)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border transition-all ${isActive ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50'}`}
                    >
                      {isActive && <Check className="w-3 h-3" />} {tag}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Cons</label>
              <div className="flex flex-wrap gap-2">
                {CON_TAGS.map(tag => {
                  const isActive = selectedCons.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      onClick={() => toggleTag(tag, selectedCons, setSelectedCons)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border transition-all ${isActive ? 'bg-rose-100 border-rose-200 text-rose-800' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50'}`}
                    >
                      {isActive && <Check className="w-3 h-3" />} {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Broker Selection & Add */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Broker</label>
            <div className="flex items-center gap-2">
              <select 
                value={brokerId} 
                onChange={e => setBrokerId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Broker</option>
                {brokers.map(b => {
                  const bId = b.id || b.broker_id;
                  return (
                  <option key={bId} value={bId}>{b.name} ({b.phone})</option>
                )})}
              </select>
              <button 
                onClick={() => setShowBrokerForm(!showBrokerForm)}
                className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
                title="Add new broker"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Mini Add Broker Form */}
            {showBrokerForm && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Quick Add Broker</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Name" value={brokerName} onChange={e=>setBrokerName(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-indigo-500" />
                  <input type="text" placeholder="Phone" value={brokerPhone} onChange={e=>setBrokerPhone(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-2">
                    {['GOOD', 'AVERAGE', 'BAD'].map(rel => (
                      <button 
                        key={rel}
                        onClick={() => setBrokerReliability(rel)}
                        className={`text-xs px-2 py-1 rounded font-bold border ${brokerReliability === rel ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleSaveBroker} 
                    disabled={isSubmittingBroker}
                    className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmittingBroker ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save Broker
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Add Property
          </button>
        </div>
      </div>
    </div>
  );
}
