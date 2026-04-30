import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Sparkles, Wand2, ArrowRight, CheckCircle, Minus, Plus, Clock, AlertTriangle } from 'lucide-react';
import { analyzeFoodImage, editFoodImage } from '../services/geminiService';
import { Donation } from '../types';

const AVAILABLE_TAGS = ['Rice', 'Curry', 'Bread', 'Dessert', 'Veg', 'Non-Veg', 'Dairy', 'Fruit'];

interface DonateProps {
    onSave: (donation: Partial<Donation>) => void;
    initialData?: Donation;
}

const Donate: React.FC<DonateProps> = ({ onSave, initialData }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Parse existing time window or default
  const [startT, endT] = initialData?.pickupWindow ? initialData.pickupWindow.split(' - ') : ['16:00', '18:00'];

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [quantity, setQuantity] = useState<number>(initialData?.weight || 5);
  const [startTime, setStartTime] = useState(startT);
  const [endTime, setEndTime] = useState(endT);
  const [isUrgent, setIsUrgent] = useState(initialData?.isUrgent || false);
  const [expiryDate, setExpiryDate] = useState<string>('');  // NEW: Expiry date/time

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Auto analyze
      setIsAnalyzing(true);
      try {
        const result = await analyzeFoodImage(selectedFile);
        setTitle(result.title);
        // Merge tags
        const newTags = new Set([...selectedTags, ...result.tags.filter((t: string) => AVAILABLE_TAGS.includes(t))]);
        setSelectedTags(Array.from(newTags));
        if (result.weightEstimate) setQuantity(result.weightEstimate);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleEditImage = async () => {
    if (!file || !editPrompt) return;
    setIsEditing(true);
    try {
        const newImageUrl = await editFoodImage(file, editPrompt);
        setPreviewUrl(newImageUrl);
        setEditPrompt("");
    } catch (e) {
        console.error("Edit failed", e);
        alert("Failed to edit image");
    } finally {
        setIsEditing(false);
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const adjustQuantity = (delta: number) => {
      setQuantity(prev => {
          const newVal = prev + delta;
          return Math.max(1, Math.min(100, newVal));
      });
  };

  const setQuickTime = (type: '1h' | '2h' | '4h' | 'eod') => {
    const now = new Date();
    // Round up to next 15 min slot for start time
    const msPer15 = 15 * 60 * 1000;
    const start = new Date(Math.ceil(now.getTime() / msPer15) * msPer15);
    
    const format = (d: Date) => d.toTimeString().slice(0, 5);
    
    setStartTime(format(start));
    
    let end = new Date(start);
    if (type === '1h') end.setHours(end.getHours() + 1);
    if (type === '2h') end.setHours(end.getHours() + 2);
    if (type === '4h') end.setHours(end.getHours() + 4);
    if (type === 'eod') {
        end.setHours(22, 0, 0, 0); // 10 PM
        // If it's already past 10PM, set for next morning? Or just let user handle it. 
        // Logic: if start is after 22:00, set end to 23:59
        if (start.getHours() >= 22) {
             end.setHours(23, 59, 0, 0);
        }
    }
    
    setEndTime(format(end));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expiryDate) {
      alert('Please set an expiry date and time for the food');
      return;
    }
    
    // Construct new donation object
    const newDonation: Partial<Donation> = {
        title,
        weight: quantity,
        tags: selectedTags,
        pickupWindow: `${startTime} - ${endTime}`,
        imageUrl: previewUrl || undefined,
        isUrgent,
        expiryDate: new Date(expiryDate).toISOString(),  // Convert to ISO format
    };

    onSave(newDonation);
    setIsSuccess(true);
  };

  if (isSuccess) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{initialData ? 'Donation Updated!' : 'Donation Broadcasted!'}</h2>
              <p className="text-stone-500 dark:text-stone-400 max-w-md mb-8">
                  {initialData 
                    ? 'Your changes have been saved and partners have been notified.' 
                    : 'Your food availability has been sent to nearby partners.'} 
                  <br />
                  Go to the <strong>My Donations</strong> tab to manage requests.
              </p>
          </div>
      );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{initialData ? 'Edit Donation' : 'Post New Donation'}</h1>
        <p className="text-stone-500 dark:text-stone-400">{initialData ? 'Update details below.' : 'Details broadcast to partners immediately.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* Image Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Food Image</label>
          
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-8 flex flex-col items-center justify-center text-stone-400 hover:border-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors cursor-pointer h-48 group"
            >
              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload size={24} className="text-stone-500 dark:text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Click to upload or drag & drop</p>
              <p className="text-xs text-stone-400 mt-1">AI will auto-detect food details</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 group">
               <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
               
               {/* Image Actions Overlay */}
               <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   type="button"
                   onClick={() => {
                     setFile(null);
                     setPreviewUrl(null);
                     setTitle('');
                     setSelectedTags([]);
                   }}
                   className="p-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur text-stone-600 dark:text-stone-300 rounded-full hover:text-red-600 shadow-sm"
                 >
                   <X size={16} />
                 </button>
               </div>
               
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2 text-forest-700 dark:text-forest-400">
                    <Loader2 size={32} className="animate-spin" />
                    <span className="text-sm font-medium">Analyzing food with Gemini...</span>
                 </div>
               )}

               {/* Magic Edit Bar */}
               <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200 dark:border-stone-800 p-3 flex gap-2 items-center">
                  <Wand2 size={16} className="text-forest-600 dark:text-forest-400" />
                  <input 
                    type="text" 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Ask AI to enhance image..."
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-stone-400 text-stone-900 dark:text-stone-100"
                  />
                  <button 
                    type="button"
                    onClick={handleEditImage}
                    disabled={!editPrompt || isEditing}
                    className="text-xs bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 rounded-md hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
                  >
                    {isEditing ? 'Editing...' : 'Apply'}
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Food Title</label>
          <div className="relative">
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lunch Buffet Leftovers"
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all placeholder:text-stone-400"
                required
            />
            {isAnalyzing && <Sparkles size={16} className="absolute right-3 top-3 text-forest-500 animate-pulse" />}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Food Type</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                  ${selectedTags.includes(tag)
                    ? 'bg-forest-600 text-white border-forest-600 shadow-sm scale-105'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-forest-300 dark:hover:border-forest-500 hover:text-forest-700 dark:hover:text-forest-400'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Redesign */}
        <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">Estimated Quantity (kg)</label>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between mb-4">
                    <button 
                        type="button" 
                        onClick={() => adjustQuantity(-1)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 transition-all active:scale-95 shadow-sm"
                    >
                        <Minus size={20} />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="flex items-baseline gap-1">
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="text-3xl font-bold text-stone-900 dark:text-stone-100 bg-transparent text-center w-24 focus:outline-none p-0"
                            />
                        </div>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wide">Kilograms</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => adjustQuantity(1)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full accent-forest-600 h-2 bg-stone-200 dark:bg-stone-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500 mt-2 font-medium">
                    <span>1 kg</span>
                    <span>25 kg</span>
                    <span>50+ kg</span>
                </div>
            </div>
        </div>

        {/* Time Window Redesign */}
        <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">Pickup Availability</label>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 space-y-4">
                {/* Quick Chips */}
                <div>
                     <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wide">Quick Select</p>
                     <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button type="button" onClick={() => setQuickTime('1h')} className="px-3 py-1.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-forest-50 dark:hover:bg-forest-900/20 hover:border-forest-200 hover:text-forest-700 dark:hover:text-forest-400 transition-colors whitespace-nowrap shadow-sm">
                            +1 Hour
                        </button>
                         <button type="button" onClick={() => setQuickTime('2h')} className="px-3 py-1.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-forest-50 dark:hover:bg-forest-900/20 hover:border-forest-200 hover:text-forest-700 dark:hover:text-forest-400 transition-colors whitespace-nowrap shadow-sm">
                            +2 Hours
                        </button>
                        <button type="button" onClick={() => setQuickTime('4h')} className="px-3 py-1.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-forest-50 dark:hover:bg-forest-900/20 hover:border-forest-200 hover:text-forest-700 dark:hover:text-forest-400 transition-colors whitespace-nowrap shadow-sm">
                            +4 Hours
                        </button>
                         <button type="button" onClick={() => setQuickTime('eod')} className="px-3 py-1.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-forest-50 dark:hover:bg-forest-900/20 hover:border-forest-200 hover:text-forest-700 dark:hover:text-forest-400 transition-colors whitespace-nowrap shadow-sm">
                            Until 10 PM
                        </button>
                    </div>
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-3">
                     <div className="flex-1">
                        <label className="text-xs text-stone-500 dark:text-stone-400 font-semibold mb-1 block flex items-center gap-1"><Clock size={12}/> Start Time</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 focus:outline-none focus:border-forest-500 text-sm font-medium text-stone-800 dark:text-stone-200"
                        />
                    </div>
                    <div className="pt-5 text-stone-400">
                        <ArrowRight size={16} />
                    </div>
                     <div className="flex-1">
                        <label className="text-xs text-stone-500 dark:text-stone-400 font-semibold mb-1 block flex items-center gap-1"><Clock size={12}/> End Time</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600 focus:outline-none focus:border-forest-500 text-sm font-medium text-stone-800 dark:text-stone-200"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Expiry Date/Time - NEW */}
        <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Food Expiry Date & Time *</label>
            <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all placeholder:text-stone-400"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">When the food will go bad. Volunteers must pick up before this time.</p>
        </div>

        {/* Urgent Flag */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}>
                <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
                <label htmlFor="urgent-toggle" className="block text-sm font-medium text-stone-900 dark:text-stone-100 cursor-pointer">
                    Mark as Urgent
                </label>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    Flag this donation for immediate pickup priority.
                </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    id="urgent-toggle" 
                    className="sr-only peer"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-amber-500"></div>
            </label>
        </div>

        <button
          type="submit"
          className="w-full bg-forest-700 dark:bg-forest-600 text-white font-medium py-3 rounded-lg hover:bg-forest-800 dark:hover:bg-forest-500 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {initialData ? 'Update Donation' : 'Broadcast Availability'}
          <ArrowRight size={18} />
        </button>

      </form>
    </div>
  );
};

export default Donate;