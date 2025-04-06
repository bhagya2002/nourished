const Loading = () => {
  const spinnerStyle: React.CSSProperties = {
    width: "50px",
    height: "50px",
    border: "5px solid rgba(0, 0, 0, 0.2)",
    borderTop: "5px solid #048c18",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={spinnerStyle}></div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
