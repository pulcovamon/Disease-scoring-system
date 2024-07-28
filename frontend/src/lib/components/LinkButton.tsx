import React from "react";
import { Link } from "react-router-dom";

export default function LinkButton({
  children,
  link,
}: {
  children: string | JSX.Element | JSX.Element[];
  link: string;
}) {
  return (
    <Link to={link} className="link-button">
      {children}
    </Link>
  );
}
