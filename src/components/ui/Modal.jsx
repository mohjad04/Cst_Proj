export default function Modal({ children, onClose }) {
    return (
        <div style={overlay} onMouseDown={onClose}>
            <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export const btnPrimary = {
    background: "#111827",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
};

export const btnSecondary = {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
};

const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
};

const modal = {
    background: "white",
    borderRadius: 14,
    padding: 20,
    maxHeight: "calc(100vh - 48px)",
    overflow: "auto",
};
