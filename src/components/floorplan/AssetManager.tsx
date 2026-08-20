import { useState, useEffect, type FormEvent } from "react";
import {
  ASSET_CATEGORIES,
  getCategoryMeta,
  type Asset,
  type AssetCategory,
  type AssetStatus,
} from "@/types/floorPlan";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { apiFetch } from "@/services/api";

interface AssetManagerProps {
  assets: Asset[];
  selectedAssetId: string | null;
  activeFloorId: string;
  isAdmin: boolean;
  onSelectAsset: (id: string | null) => void;
  onAddAsset: (asset: {
    code?: string;
    name: string;
    category: AssetCategory;
    floor_id: string;
    x_pct: number;
    y_pct: number;
    assigned_to?: string | null;
  }) => Promise<void>;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
  onSaveLayout?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
}

export function AssetManager({
  assets,
  selectedAssetId,
  activeFloorId,
  isAdmin,
  onSelectAsset,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onSaveLayout,
  hasUnsavedChanges,
}: AssetManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // New asset form state
  const [newCategory, setNewCategory] = useState<AssetCategory>("laptop");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch suggested code whenever category changes in add modal
  useEffect(() => {
    if (showAddModal) {
      apiFetch<{ code: string }>(`/assets/suggest-code?category=${newCategory}`)
        .then(({ code }) => setNewCode(code))
        .catch(() => {
          const meta = getCategoryMeta(newCategory);
          setNewCode(`${meta.prefix}001`);
        });
    }
  }, [newCategory, showAddModal]);

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onAddAsset({
        code: newCode.trim() || undefined,
        name: newName.trim(),
        category: newCategory,
        floor_id: activeFloorId,
        x_pct: 50,
        y_pct: 50,
      });
      setNewName("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setIsSubmitting(true);
    try {
      await onUpdateAsset(editingAsset.id, {
        code: editingAsset.code,
        name: editingAsset.name,
        category: editingAsset.category,
        status: editingAsset.status,
      });
      setEditingAsset(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (categoryFilter !== "all" && asset.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        asset.code.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        (asset.assigned_employee_name && asset.assigned_employee_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const assetToDelete = assets.find((a) => a.id === deletingAssetId);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Floor Assets</h3>
          <p className="text-xs text-muted">
            {filteredAssets.length} {filteredAssets.length === 1 ? "item" : "items"} on this floor
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {hasUnsavedChanges && onSaveLayout && (
                <button
                  onClick={onSaveLayout}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors animate-pulse"
                >
                  💾 Save Layout
                </button>
              )}
              <button
                onClick={() => {
                  setNewCategory("laptop");
                  setNewName("");
                  setShowAddModal(true);
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-forest-600 transition-colors"
              >
                + Add Asset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search by code (e.g. LAP001) or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-background px-3 py-1.5 text-xs text-ink outline-none focus:border-primary"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-line bg-background px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
        >
          <option value="all">All Categories</option>
          {ASSET_CATEGORIES.map((c) => (
            <option key={c.category} value={c.category}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Asset List */}
      <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto pr-1">
        {filteredAssets.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No assets match your search.</p>
        ) : (
          filteredAssets.map((asset) => {
            const meta = getCategoryMeta(asset.category);
            const isSelected = asset.id === selectedAssetId;

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(isSelected ? null : asset.id)}
                className={`flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-line bg-surface hover:border-primary/40 hover:bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary">{asset.code}</span>
                        <span className="text-xs font-bold text-ink">{asset.name}</span>
                      </div>
                      <span className="text-[11px] text-muted">
                        Category: {meta.label} • Loc: ({asset.x_pct.toFixed(0)}%, {asset.y_pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      asset.status === "present"
                        ? "bg-emerald-100 text-emerald-800"
                        : asset.status === "removed"
                        ? "bg-red-100 text-danger"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-line/50 pt-2 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAsset(isSelected ? null : asset.id);
                    }}
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      isSelected ? "bg-primary text-white" : "border border-line text-ink hover:bg-background"
                    }`}
                  >
                    {isSelected ? "📍 Showing Directions" : "📍 Get Directions"}
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingAssetId(asset.id)}
                        className="text-xs text-danger hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-ink">Add New Asset</h3>
            <p className="mt-1 text-xs text-muted">
              Register a new hardware item or workplace resource with automatic naming.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Asset Category
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.icon} {c.label} ({c.prefix})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Asset Code (Auto-generated convention)
                <input
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAP001"
                  className="rounded-lg border border-line bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Asset Model / Name
                <input
                  required
                  placeholder="e.g. MacBook Pro 16 / Dell UltraSharp"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>

              {formError && <p className="text-xs text-danger">{formError}</p>}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Adding…" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-ink">Edit Asset: {editingAsset.code}</h3>

            <form onSubmit={handleUpdateSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Asset Code
                <input
                  required
                  value={editingAsset.code}
                  onChange={(e) => setEditingAsset({ ...editingAsset, code: e.target.value.toUpperCase() })}
                  className="rounded-lg border border-line bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Asset Name
                <input
                  required
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Category
                <select
                  value={editingAsset.category}
                  onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value as AssetCategory })}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                Status
                <select
                  value={editingAsset.status}
                  onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value as AssetStatus })}
                  className="rounded-lg border border-line bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="present">Present (Active on floor)</option>
                  <option value="removed">Removed / Decommissioned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Reconfirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingAssetId)}
        title="Remove Asset from Floor Map"
        message={`Are you sure you want to remove ${assetToDelete?.code} (${assetToDelete?.name})? This will log an unusual movement alert for the audit trail.`}
        confirmLabel="Yes, Remove Asset"
        confirmVariant="danger"
        onConfirm={async () => {
          if (deletingAssetId) {
            await onDeleteAsset(deletingAssetId);
            setDeletingAssetId(null);
          }
        }}
        onCancel={() => setDeletingAssetId(null)}
      />
    </div>
  );
}
