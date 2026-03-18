import { Link } from 'react-router-dom';
import BetSlip from '../components/BetSlip';
import { useBetSlip } from '../context/BetSlipContext';

export default function BetSlipPage() {
  const { selections } = useBetSlip();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Your Bet Slip</h1>
        <Link 
          to="/" 
          className="px-4 py-2 bg-[#2a2f3f] text-white rounded-lg hover:bg-[#353b4d] transition-colors"
        >
          ← Back to Matches
        </Link>
      </div>

      {selections.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-lg p-12 text-center">
          <div className="text-6xl text-gray-600 mb-4">📋</div>
          <h2 className="text-xl text-white mb-2">Your bet slip is empty</h2>
          <p className="text-gray-400 mb-6">Add selections from matches to start building your bet</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999] transition-colors"
          >
            Browse Matches
          </Link>
        </div>
      ) : (
        <div className="bg-[#1a1f2e] rounded-lg p-6">
          <BetSlip />
        </div>
      )}
    </div>
  );
}