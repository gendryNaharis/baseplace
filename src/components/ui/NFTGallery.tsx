"use client";

import { useEffect, useState } from "react";
import { supabase, type MintedNFT, type CanvasSession } from "~/lib/supabase";
import { Button } from "./Button";

interface NFTWithSession extends MintedNFT {
  canvas_session: CanvasSession;
}

export function NFTGallery() {
  const [nfts, setNfts] = useState<NFTWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTWithSession | null>(null);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("minted_nfts")
        .select(`
          *,
          canvas_session:canvas_sessions(*)
        `)
        .order("minted_at", { ascending: false });

      if (error) {
        console.error("Error loading NFTs:", error);
        return;
      }

      if (data) {
        setNfts(data as any);
      }
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No NFTs Yet</h3>
        <p className="text-gray-600">
          Be part of the first canvas to be minted as an NFT!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Previous Canvases</h2>
        <div className="text-sm text-gray-600">{nfts.length} minted</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            onClick={() => setSelectedNFT(nft)}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer transition-all hover:scale-105"
          >
            {nft.image_url ? (
              <img
                src={nft.image_url}
                alt={`Canvas #${nft.token_id}`}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-xs">NFT #{nft.token_id}</div>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="text-white text-xs font-medium">
                #{nft.token_id}
              </div>
              <div className="text-white/80 text-[10px]">
                {formatDate(nft.minted_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNFT(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Canvas NFT #{selectedNFT.token_id}</h3>
              <button
                onClick={() => setSelectedNFT(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              {selectedNFT.image_url ? (
                <img
                  src={selectedNFT.image_url}
                  alt={`Canvas #${selectedNFT.token_id}`}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  <div className="text-6xl">🖼️</div>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Token ID:</span>
                <span className="font-medium">{selectedNFT.token_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minted:</span>
                <span className="font-medium">{formatDate(selectedNFT.minted_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Session ID:</span>
                <span className="font-medium text-xs">
                  {selectedNFT.canvas_session_id.slice(0, 8)}...
                </span>
              </div>
              {selectedNFT.ipfs_hash && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IPFS:</span>
                  <a
                    href={`https://ipfs.io/ipfs/${selectedNFT.ipfs_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline text-xs"
                  >
                    View on IPFS
                  </a>
                </div>
              )}
              {selectedNFT.contract_address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract:</span>
                  <a
                    href={`https://basescan.org/address/${selectedNFT.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline text-xs"
                  >
                    View on Basescan
                  </a>
                </div>
              )}
            </div>

            <Button
              onClick={() => setSelectedNFT(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

