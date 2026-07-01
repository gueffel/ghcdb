import React from 'react';
import { MiniStats, MiniSidebar, MiniOwnedToggle, MiniWishlist, MiniSearch, MiniAddSingle, MiniImport } from '../components/HintMiniUIs.jsx';

function QuickCard({ icon, title, body }) {
  return (
    <div className="help-quick-card">
      <span className="help-quick-icon">{icon}</span>
      <div className="help-quick-title">{title}</div>
      <p className="help-quick-body">{body}</p>
    </div>
  );
}

function Topic({ title, eyebrow, mini, children }) {
  return (
    <div className="help-topic">
      {eyebrow && <div className="help-eyebrow">{eyebrow}</div>}
      <h2 className="help-topic-title">{title}</h2>
      {mini ? (
        <div className="help-topic-inner">
          <div>{children}</div>
          <div className="help-mini">{mini}</div>
        </div>
      ) : children}
    </div>
  );
}

export default function Help() {
  return (
    <div className="page page-mid">
      <h1 className="page-title">Help</h1>
      <p className="help-intro">GHCdb is a checklist and tracker for your hockey card collection. Here's how to get the most out of it.</p>

      <div className="help-quick-grid">
        <QuickCard
          icon="✓"
          title="Tick off your cards"
          body="Click the checkmark next to any card to mark it owned. Tap again to unmark it. For numbered cards you'll be asked for your copy number."
        />
        <QuickCard
          icon="📥"
          title="Import a spreadsheet"
          body="Already have your collection in a spreadsheet? Export it as CSV and drop it into Import — GHCdb figures out the columns automatically."
        />
        <QuickCard
          icon="♥"
          title="Track what you're hunting"
          body="Heart any card you're after. Your wishlist shows up on the Overview page so you never lose track of what you need."
        />
      </div>

      <Topic title="Your dashboard" eyebrow="Overview" mini={<MiniStats />}>
        <p>The Overview page gives you the big picture — how many cards you own, your rookie and auto counts, which sets are closest to complete, and your most recently added cards. The team breakdown and year charts are there too if you want to see how your collection is spread across the league.</p>
      </Topic>

      <Topic title="The collection page" eyebrow="Collection" mini={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MiniSidebar />
          <MiniOwnedToggle />
        </div>
      }>
        <p>This is where you'll spend most of your time. Your sets live in the sidebar on the left — click a year to expand it, then pick a set to load its cards on the right.</p>
        <ul>
          <li>Click <strong>All Collections</strong> at the top to see every card you're tracking at once.</li>
          <li>The <strong>Owned / Missing / All</strong> tabs let you focus on just what you need — Missing is great for knowing what you're still after.</li>
          <li>The search box filters by player, card number, team, or set name.</li>
          <li>The <strong>+</strong> button in the sidebar lets you add a full set from the catalog in one shot — no manual entry needed.</li>
          <li>The <strong>del</strong> button next to a set name removes all cards in that set.</li>
          <li>Click the <strong>pencil</strong> on any card row to edit its details or delete it.</li>
        </ul>
      </Topic>

      <Topic title="Your wishlist" eyebrow="Wishlist" mini={<MiniWishlist />}>
        <p>The wishlist is for cards you don't have yet but are actively looking for. It keeps them separate from your general "missing" cards so you can see what you're actually hunting.</p>
        <ul>
          <li>Click the <strong>♥</strong> on any card you don't own to add it to your wishlist. Click again to remove it.</li>
          <li>When you mark a wishlisted card as owned, it's automatically taken off the wishlist.</li>
          <li>Your wishlist shows up on the Overview page and is searchable and paginated so it stays useful even when it grows.</li>
        </ul>
      </Topic>

      <Topic title="Search" eyebrow="Finding cards" mini={<MiniSearch />}>
        <p>Search looks across your entire collection at once — player, team, card number, set name, year, product. Results update as you type. Use the filter dropdowns to narrow things down by year, product, rookie or auto status, or whether you own it.</p>
      </Topic>

      <Topic title="Adding a single card" eyebrow="Add card" mini={<MiniAddSingle />}>
        <p>Use the Add Single page to add one card at a time without needing a spreadsheet. Fill in what you know and hit Save.</p>
        <p>If a card with the same number already exists in that set, GHCdb will mark it owned — or bump your duplicate count if you already had it.</p>
      </Topic>

      <Topic title="Importing from a spreadsheet" eyebrow="Import CSV">
        <p>Export your spreadsheet as CSV and drop it into the Import page. GHCdb maps the columns automatically as long as you use recognisable names.</p>
        <div className="help-mini" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>What your CSV might look like</div>
          <MiniImport />
        </div>
        <table className="data-table help-table" style={{ marginBottom: 14 }}>
          <thead><tr><th>Field</th><th>Column names it recognises</th></tr></thead>
          <tbody>
            <tr><td>Card #</td><td>Card Number, Card #, #, Card</td></tr>
            <tr><td>Set Name</td><td>Set Name, Subset, Insert, Parallel</td></tr>
            <tr><td>Player</td><td>Description, Player, Name, Subject</td></tr>
            <tr><td>Team City</td><td>Team City, City</td></tr>
            <tr><td>Team Name</td><td>Team Name, Team</td></tr>
            <tr><td>Rookie</td><td>Rookie, RC</td></tr>
            <tr><td>Auto</td><td>Auto, Autograph</td></tr>
            <tr><td>Mem / Relic</td><td>Mem, Memorabilia, Relic, Patch</td></tr>
            <tr><td>Serial #</td><td>Serial, Serial Number</td></tr>
            <tr><td>Serial Of</td><td>Of, Serial Of, Numbered To</td></tr>
            <tr><td>Thickness</td><td>Thickness</td></tr>
            <tr><td>Year</td><td>Year, Season</td></tr>
            <tr><td>Product</td><td>Product, Set</td></tr>
            <tr><td>Grade</td><td>Grade</td></tr>
            <tr><td>Owned</td><td>Owned</td></tr>
            <tr><td>Duplicates</td><td>Duplicates, Dupes, Dups, Duplicate</td></tr>
          </tbody>
        </table>
        <p>For yes/no columns like Owned, Rookie, and Auto — TRUE, YES, Y, 1, or X all count as yes. Anything else is no.</p>
        <div className="help-tip">
          <strong>Replace mode:</strong> wipes the existing cards for a specific year and product before importing. Use it when you're re-importing a corrected file and don't want duplicates stacking up.
        </div>
      </Topic>

      <Topic title="Hockey card lingo" eyebrow="Reference">
        <p>Here's how the terminology maps to what GHCdb actually does:</p>
        <ul>
          <li><strong>Product</strong> is the release — <em>2024-25 Upper Deck Series 1</em> or <em>2023-24 SP Authentic</em>. One box, one product.</li>
          <li><strong>Set Name</strong> is the subset or parallel within that product. Series 1 has Base, Young Guns, Silver Foil, UD Canvas — each of those is a separate set within the same product.</li>
          <li><strong>Year</strong> is the season, like <em>2024-25</em>. GHCdb uses it to group your products in the sidebar.</li>
          <li><strong>Serial / Of</strong> — for numbered cards, Serial is your specific copy and Of is the print run. Card 14 of 99: Serial = 14, Of = 99.</li>
          <li><strong>Thickness</strong> — measured in points. Handy for thick relics, patches, and 1/1s.</li>
          <li><strong>Grade</strong> — the grading company and score, like PSA 10 or BGS 9.5.</li>
          <li><strong>Duplicates</strong> — how many extra copies of a card you have beyond the first.</li>
        </ul>
      </Topic>

      <Topic title="Account & settings" eyebrow="Account">
        <p>Click your name (or the ⚙ icon) in the top right to get to Settings. You can update your name, change your password, and turn the guided tip bubbles on or off. You can also export your collection as CSV from the Collection page if you ever need a copy of your data.</p>
        <p>If you forget your password, hit <strong>Forgot password?</strong> on the sign-in screen and we'll send you a reset link.</p>
      </Topic>
    </div>
  );
}
