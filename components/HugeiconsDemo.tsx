'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import * as HugeIcons from '@hugeicons/core-free-icons';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Send,
  Home,
  Search,
  Bell,
  User,
  Settings,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  Share2,
  Copy,
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';

export default function HugeiconsDemo() {
  const iconSize = 24;
  const strokeWidth = 1.5;

  // Map of common icons used in your app
  // Note: Free version uses simple names (no 01, 02, 03 suffixes)
  const iconComparison = [
    { name: 'Upload', lucide: Upload, huge: HugeIcons.UploadIcon },
    { name: 'File/Document', lucide: FileText, huge: HugeIcons.FileIcon },
    { name: 'Calendar', lucide: Calendar, huge: HugeIcons.CalendarIcon },
    { name: 'Download', lucide: Download, huge: HugeIcons.DownloadIcon },
    { name: 'Alert/Warning', lucide: AlertCircle, huge: HugeIcons.AlertCircleIcon },
    { name: 'Check/Success', lucide: CheckCircle, huge: HugeIcons.CheckmarkCircleIcon },
    { name: 'Send/Submit', lucide: Send, huge: HugeIcons.SentIcon },
    { name: 'Home', lucide: Home, huge: HugeIcons.HomeIcon },
    { name: 'Search', lucide: Search, huge: HugeIcons.SearchIcon },
    { name: 'Notifications', lucide: Bell, huge: HugeIcons.NotificationIcon },
    { name: 'User/Profile', lucide: User, huge: HugeIcons.UserIcon },
    { name: 'Settings', lucide: Settings, huge: HugeIcons.SettingsIcon },
    { name: 'Menu', lucide: Menu, huge: HugeIcons.MenuIcon },
    { name: 'Close', lucide: X, huge: HugeIcons.CancelIcon },
    { name: 'Add/Plus', lucide: Plus, huge: HugeIcons.AddIcon },
    { name: 'Edit', lucide: Edit, huge: HugeIcons.EditIcon },
    { name: 'Delete/Trash', lucide: Trash2, huge: HugeIcons.DeleteIcon },
    { name: 'Arrow Right', lucide: ArrowRight, huge: HugeIcons.ArrowRightIcon },
    { name: 'Arrow Left', lucide: ArrowLeft, huge: HugeIcons.ArrowLeftIcon },
    { name: 'Chevron Down', lucide: ChevronDown, huge: HugeIcons.ArrowDownIcon },
    { name: 'Chevron Up', lucide: ChevronUp, huge: HugeIcons.ArrowUpIcon },
    { name: 'Star/Favorite', lucide: Star, huge: HugeIcons.StarIcon },
    { name: 'Heart/Like', lucide: Heart, huge: HugeIcons.FavouriteIcon },
    { name: 'Share', lucide: Share2, huge: HugeIcons.ShareIcon },
    { name: 'Copy', lucide: Copy, huge: HugeIcons.CopyIcon },
    { name: 'View/Eye', lucide: Eye, huge: HugeIcons.ViewIcon },
    { name: 'Email', lucide: Mail, huge: HugeIcons.MailIcon },
    { name: 'Phone', lucide: Phone, huge: HugeIcons.CallIcon },
    { name: 'Location/Pin', lucide: MapPin, huge: HugeIcons.LocationIcon },
    { name: 'Time/Clock', lucide: Clock, huge: HugeIcons.ClockIcon },
    { name: 'Money/Dollar', lucide: DollarSign, huge: HugeIcons.DollarCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            🎨 Icon Comparison: Lucide vs Hugeicons
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Compare the icons side-by-side to see which style you prefer
          </p>
          <p className="text-sm text-slate-500">
            Free version: 4,000+ icons | Size: {iconSize}px | Stroke: {strokeWidth}
          </p>
        </div>

        {/* Icons Grid */}
        <div className="grid gap-6">
          {iconComparison.map((item) => (
            <div 
              key={item.name}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Name */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">Common use case</p>
                </div>

                {/* Lucide */}
                <div className="flex items-center justify-center gap-4 p-6 bg-slate-50 rounded-lg">
                  <item.lucide size={iconSize} strokeWidth={strokeWidth} className="text-slate-700" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-500 uppercase">Lucide React</p>
                    <p className="text-sm text-slate-700">(Current)</p>
                  </div>
                </div>

                {/* Hugeicons */}
                <div className="flex items-center justify-center gap-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <HugeiconsIcon 
                    icon={item.huge} 
                    size={iconSize} 
                    strokeWidth={strokeWidth}
                    className="text-blue-700"
                  />
                  <div className="text-left">
                    <p className="text-xs font-medium text-blue-600 uppercase">Hugeicons Free</p>
                    <p className="text-sm text-blue-700">(New Option)</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">💡 How to Use Hugeicons</h2>
          
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Import the icons:</h3>
              <code className="text-sm bg-slate-900 text-green-400 p-3 rounded block">
                import {'{ HugeiconsIcon }'} from '@hugeicons/react';<br />
                import {'{ UploadIcon, FileIcon }'} from '@hugeicons/core-free-icons';
              </code>
              <p className="text-xs text-slate-500 mt-2">
                Note: Free version uses simple names (e.g., UploadIcon). Pro has variants (Upload01Icon, Upload02Icon, etc.)
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Use in your components:</h3>
              <code className="text-sm bg-slate-900 text-green-400 p-3 rounded block">
                {'<HugeiconsIcon icon={UploadIcon} size={24} strokeWidth={1.5} />'}
              </code>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">✅ Free Version Benefits:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• 4,000+ free icons (vs ~1,400 in Lucide)</li>
                <li>• Modern, consistent stroke-rounded design</li>
                <li>• Works with your existing shadcn/ui setup</li>
                <li>• Same API pattern as Lucide (easy to migrate)</li>
                <li>• Simple naming: UploadIcon, FileIcon, etc.</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">🌟 Pro Version Adds:</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• 40,000+ icons (10x more than free!)</li>
                <li>• 9 different styles: stroke, solid, duotone, bulk, twotone</li>
                <li>• Multiple variants: Upload01Icon, Upload02Icon, Upload03Icon</li>
                <li>• All 3 corner styles: rounded, sharp, standard</li>
                <li>• $99 one-time payment (lifetime access)</li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">💰 Pricing Summary:</h3>
              <p className="text-sm text-amber-800">
                <strong>Free:</strong> 4,000+ icons (what you're seeing now)<br />
                <strong>Pro:</strong> $99 one-time for 40,000+ icons + 9 styles + variants
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

