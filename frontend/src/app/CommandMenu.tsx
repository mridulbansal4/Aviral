import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Users, LayoutDashboard, Settings } from "lucide-react";
import "./command.css";

export function CommandMenu() {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}>
        <Command className="cmdk-dialog" loop>
          <div className="cmdk-header">
            <Search size={16} className="cmdk-search-icon" />
            <Command.Input placeholder="Search applicants, commands, or settings..." autoFocus />
          </div>
          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">No results found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => setOpen(false)}>
                <LayoutDashboard size={14} />
                Overview
              </Command.Item>
              <Command.Item onSelect={() => setOpen(false)}>
                <Users size={14} />
                Applicants
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item onSelect={() => setOpen(false)}>
                <Settings size={14} />
                System Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
