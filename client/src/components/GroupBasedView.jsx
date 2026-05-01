import React from "react";
import { useAsgardeoGroups } from "../hooks/useAsgardeoGroups";

const GroupBasedView = ({ adminView, reviewerView, studentView }) => {
  const { isAdmin, isReviewer, loading } = useAsgardeoGroups();

  if (loading) {
    return (
      <div className="page-loader" data-testid="group-view-loader">
        <div style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          minHeight: "200px"
        }}>
          Refreshing permissions…
        </div>
      </div>
    );
  }

  if (isAdmin && adminView) {
    return adminView;
  }

  if (isReviewer && reviewerView) {
    return reviewerView;
  }

  // Default fallback is the student view
  return studentView || null;
};

export default GroupBasedView;
