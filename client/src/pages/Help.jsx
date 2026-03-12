import React, { useState } from 'react';

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="help-section">
      <button className="help-section-toggle" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className="help-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="help-section-body">{children}</div>}
    </div>
  );
}

export default function Help() {
  return (
    <div className="page page-narrow">
      <h1 className="page-title">Help &amp; Guide</h1>
      <p className="help-intro">GHCdb is a personal hockey card collection tracker. Use it to log every card in your collection, mark which ones you own, and get stats on your progress.</p>

      <Section title="Overview">
        <p>The Overview page shows a summary of your entire collection at a glance:</p>
        <ul>
          <li><strong>Owned</strong> — how many cards you currently have in hand, and what % of your total catalogue that covers.</li>
          <li><strong>Rookies / Autos / Graded</strong> — counts of owned cards with those attributes vs. your total.</li>
          <li><strong>Duplicates</strong> — total extra copies tracked across your collection.</li>
          <li><strong>Most Owned Player / Set</strong> — the description and product with the highest owned-card count.</li>
          <li><strong>Charts</strong> — a pie chart of owned cards by NHL team (using official team colours) and a stacked bar chart breaking down owned vs. not-owned by year.</li>
          <li><strong>Products table</strong> — every year/set with owned and total counts and a completion bar.</li>
          <li><strong>Recently Added</strong> — the last 10 cards you marked as owned.</li>
        </ul>
      </Section>

      <Section title="Collection">
        <p>The Collection page is your main workspace. The left sidebar lists every product (set) you've imported, grouped by year.</p>
        <ul>
          <li>Click a <strong>year</strong> to expand it and see its sets. The <code>owned/total</code> count is shown next to each year and set.</li>
          <li>Click a <strong>product name</strong> to load that set's full card list on the right.</li>
          <li>Click <strong>All Collections</strong> to see every card across all sets in one table.</li>
          <li>Use the <strong>Owned / Missing / All</strong> tabs and the search box to filter what you see.</li>
          <li>Click the <strong>✓ / ○ button</strong> on any row to toggle whether you own that card. If the card has a serial number slot, you'll be prompted to enter your copy's number.</li>
          <li>Click the <strong>✎ pencil</strong> to open a full edit modal — update any field or delete the card entirely.</li>
          <li>The <strong>+ button</strong> in the sidebar header opens the Catalog Picker, letting you add a pre-built set from the admin catalog.</li>
          <li>The <strong>del</strong> button next to a set removes every card in that product from your collection.</li>
        </ul>
      </Section>

      <Section title="Wishlist">
        <p>The wishlist lets you flag cards you don't own yet but want to track separately from your general missing cards.</p>
        <ul>
          <li>Click the <strong>♥ heart button</strong> on any unowned card in the Collection or Search table to add it to your wishlist. Click it again to remove it.</li>
          <li>The heart button is also available in the card detail modal for unowned cards.</li>
          <li>Marking a wishlisted card as <strong>owned</strong> automatically removes it from the wishlist.</li>
          <li>Your wishlist is shown in the <strong>Overview</strong> page as a quick-access panel. Click any row to open the card detail.</li>
        </ul>
      </Section>

      <Section title="Search">
        <p>Search scans across your entire collection simultaneously — player name, team, card number, set name, and more. Results update as you type. Use the filter dropdowns to narrow by year, product, rookie status, auto status, or owned status.</p>
      </Section>

      <Section title="Add Card">
        <p>Add a single card manually without importing a CSV. Fill in the fields and click Save. If a card with the same number already exists in that product:</p>
        <ul>
          <li>If it wasn't owned, it will be marked as owned.</li>
          <li>If it was already owned, the duplicate count will increase by 1.</li>
        </ul>
      </Section>

      <Section title="Import CSV">
        <p>The fastest way to load a full set is to import a CSV file. Your file can use any of these column names (case-insensitive):</p>
        <table className="data-table help-table">
          <thead><tr><th>Field</th><th>Accepted headers</th></tr></thead>
          <tbody>
            <tr><td>Card #</td><td>Card Number, Card #, #, Card</td></tr>
            <tr><td>Set Name</td><td>Set Name, Subset, Insert, Parallel</td></tr>
            <tr><td>Description</td><td>Description, Player, Name, Subject</td></tr>
            <tr><td>Team City</td><td>Team City, City</td></tr>
            <tr><td>Team Name</td><td>Team Name, Team</td></tr>
            <tr><td>Rookie</td><td>Rookie, RC</td></tr>
            <tr><td>Auto</td><td>Auto, Autograph</td></tr>
            <tr><td>Mem</td><td>Mem, Memorabilia, Relic, Patch</td></tr>
            <tr><td>Serial</td><td>Serial, Serial Number</td></tr>
            <tr><td>Serial Of</td><td>Of, Serial Of, Numbered To</td></tr>
            <tr><td>Thickness</td><td>Thickness</td></tr>
            <tr><td>Year</td><td>Year, Season</td></tr>
            <tr><td>Product</td><td>Product, Set</td></tr>
            <tr><td>Grade</td><td>Grade</td></tr>
            <tr><td>Owned</td><td>Owned</td></tr>
            <tr><td>Duplicates</td><td>Duplicates, Dupes, Dups, Duplicate</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>Boolean columns (Owned, Rookie, Auto) accept: <code>TRUE</code>, <code>YES</code>, <code>Y</code>, <code>1</code>, <code>X</code> (case-insensitive). Anything else is treated as false.</p>
        <p><strong>Replace mode</strong> — if you enable this option and pick a year/product, all existing cards for that set will be deleted before the import runs. Useful for re-importing a corrected file.</p>
      </Section>

      <Section title="Nomenclature">
        <p>GHCdb uses specific terms to organise your cards. Here's what each one means:</p>
        <ul>
          <li><strong>Product</strong> — the release or set name as sold by the manufacturer. Examples: <em>2024-25 Upper Deck Series 1</em>, <em>2023-24 SP Authentic</em>, <em>2022-23 Trilogy</em>. A product maps to one physical box or release. All cards imported together are typically from the same product.</li>
          <li><strong>Set Name</strong> — a subset, insert, or parallel within a product. A single product contains many sets. Examples within <em>Series 1</em>: <em>Base</em>, <em>Young Guns</em>, <em>Silver Foil</em>, <em>UD Canvas</em>. Within <em>SP Authentic</em>: <em>Base</em>, <em>Future Watch</em>, <em>Autographs</em>. The Set Name column in the table distinguishes cards that share the same card number but belong to different subsets.</li>
          <li><strong>Year</strong> — the season the product was released, e.g. <em>2024-25</em>. Used to group products in the Collection sidebar.</li>
        </ul>
        <p>In short: <strong>Product → Set Name → Card</strong>. One product contains many sets, each of which contains individual cards.</p>
      </Section>

      <Section title="Card Fields Explained">
        <ul>
          <li><strong>Card #</strong> — the printed number on the card (e.g. <code>42</code>, <code>RC-12</code>).</li>
          <li><strong>Set Name</strong> — the subset or parallel within a product (e.g. "Silver Prizm", "Base").</li>
          <li><strong>Serial / Of</strong> — for numbered cards. <em>Serial</em> is your specific copy number; <em>Of</em> is the print run (e.g. serial 14 of 99).</li>
          <li><strong>Thickness</strong> — card thickness in points, useful for identifying thick relics or 1/1s.</li>
          <li><strong>Grade</strong> — grading company and grade (e.g. "PSA 10", "BGS 9.5").</li>
          <li><strong>Duplicates</strong> — how many extra copies of this card you own beyond the first.</li>
          <li><strong>Owned</strong> — whether you physically have this card. Toggle it anytime from the collection table.</li>
        </ul>
      </Section>

      <Section title="Account &amp; Settings">
        <p>Access your account settings by clicking your name in the top-right corner.</p>
        <ul>
          <li>Update your first name, last name, or email address.</li>
          <li>Change your password — you'll need your current password to set a new one.</li>
          <li>If you forget your password, use the <strong>Forgot password?</strong> link on the sign-in screen. A reset link will be emailed to your registered address (valid for 1 hour).</li>
        </ul>
      </Section>
    </div>
  );
}
