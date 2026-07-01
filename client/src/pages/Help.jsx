import React, { useState } from 'react';

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="help-section">
      <button className="help-section-toggle" onClick={() => setOpen(o => !o)}>
        <span className="help-section-label">
          {icon && <span className="help-icon">{icon}</span>}
          {title}
        </span>
        <span className={`help-arrow${open ? ' open' : ''}`} />
      </button>
      {open && <div className="help-section-body">{children}</div>}
    </div>
  );
}

export default function Help() {
  return (
    <div className="page page-narrow">
      <h1 className="page-title">Help</h1>
      <p className="help-intro">GHCdb keeps track of every hockey card you own and every one you're still looking for. Here's how everything works.</p>

      <Section title="Overview" icon="📊">
        <p>The Overview page gives you a quick snapshot of your whole collection:</p>
        <ul>
          <li><strong>Owned:</strong> how many cards you have, and what percentage of your full catalogue that covers.</li>
          <li><strong>Rookies / Autos / Graded:</strong> how many of your owned cards have those attributes.</li>
          <li><strong>Duplicates:</strong> how many extra copies you're tracking across your collection.</li>
          <li><strong>Most Owned Player / Set:</strong> who and what shows up the most in your collection.</li>
          <li><strong>Charts:</strong> a pie chart showing your cards by NHL team, and a bar chart breaking down owned vs. missing by year.</li>
          <li><strong>Products table:</strong> every set you're tracking, with a completion bar for each one.</li>
          <li><strong>Recently Added:</strong> the last 10 cards you marked as owned.</li>
        </ul>
      </Section>

      <Section title="Your Collection" icon="📦">
        <p>This is where most of the action happens. The sidebar on the left lists every set you're tracking, grouped by year.</p>
        <ul>
          <li>Click a <strong>year</strong> to expand it and see all the sets underneath. You'll see how many cards you own out of the total.</li>
          <li>Click a <strong>set name</strong> to pull up the full card list on the right.</li>
          <li>Click <strong>All Collections</strong> at the top to see every card across all your sets in one table.</li>
          <li>Use the <strong>Owned / Missing / All</strong> tabs and the search box to find specific cards quickly.</li>
          <li>Click the <strong>✓ / ○ button</strong> on any card to mark it owned or missing. For numbered cards, you'll be asked for your copy's number.</li>
          <li>Click the <strong>✎ pencil</strong> to edit a card's details or remove it entirely.</li>
          <li>The <strong>+</strong> button at the top of the sidebar lets you add a whole set from the catalog in one go.</li>
          <li>The <strong>del</strong> button next to a set removes all cards in that set from your collection.</li>
        </ul>
      </Section>

      <Section title="Wishlist" icon="♥">
        <p>The wishlist is for cards you don't own yet but are actively looking for. It keeps them separate from your general missing cards so you always know what you're hunting.</p>
        <ul>
          <li>Click the <strong>♥ heart</strong> on any card you don't own to add it to your wishlist. Click it again to remove it.</li>
          <li>The heart is also available in the card detail view.</li>
          <li>When you mark a wishlisted card as owned, it's automatically taken off your wishlist.</li>
          <li>Your wishlist appears on the Overview page so you can always see what you're after at a glance.</li>
        </ul>
      </Section>

      <Section title="Search" icon="🔍">
        <p>Search looks across your whole collection at once: player name, team, card number, set name, and more. Results update as you type. Use the filter dropdowns to narrow things down by year, product, rookie or auto status, or whether you own it.</p>
      </Section>

      <Section title="Adding a Single Card" icon="➕">
        <p>Use this to add one card at a time without needing a spreadsheet. Fill in what you know and hit Save. If a card with the same number is already in that set:</p>
        <ul>
          <li>If you didn't have it yet, it'll be marked as owned.</li>
          <li>If you already had it, your duplicate count for that card goes up by 1.</li>
        </ul>
      </Section>

      <Section title="Importing from a Spreadsheet" icon="📂">
        <p>Got your collection in a spreadsheet? Import it as a CSV and GHCdb will map the columns automatically. Your file can use any of these column names:</p>
        <table className="data-table help-table">
          <thead><tr><th>Field</th><th>Accepted column names</th></tr></thead>
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
        <p style={{ marginTop: 12 }}>For yes/no columns like Owned, Rookie, and Auto, use TRUE, YES, Y, 1, or X to mean yes. Anything else counts as no.</p>
        <div className="help-tip">
          <strong>Replace mode:</strong> turning this on and picking a year and product will clear out all existing cards for that set before importing. Handy if you're re-importing a corrected file and don't want duplicates piling up.
        </div>
      </Section>

      <Section title="Key Terms" icon="📖">
        <p>The hobby has its own lingo, and so does GHCdb. Here's what the main terms mean:</p>
        <ul>
          <li><strong>Product:</strong> the physical release, as it comes off the shelf. Think <em>2024-25 Upper Deck Series 1</em> or <em>2023-24 SP Authentic</em>. One box, one product.</li>
          <li><strong>Set Name:</strong> a specific subset, insert, or parallel within a product. Series 1 for example has Base cards, Young Guns, Silver Foil, UD Canvas, and more — each is a different set within the same product.</li>
          <li><strong>Year:</strong> the season, like <em>2024-25</em>. Used to group your products in the sidebar.</li>
        </ul>
        <p>The short version: one <strong>Product</strong> has many <strong>Set Names</strong>, each of which has individual <strong>Cards</strong>.</p>
      </Section>

      <Section title="What Each Field Means" icon="🃏">
        <ul>
          <li><strong>Card #:</strong> the number printed on the card, like <code>42</code> or <code>RC-12</code>.</li>
          <li><strong>Set Name:</strong> the subset or parallel the card belongs to, like "Young Guns" or "Silver Foil".</li>
          <li><strong>Serial / Of:</strong> for numbered cards. Serial is your specific copy; Of is how many were made. If you have card 14 of 99, Serial is 14 and Of is 99.</li>
          <li><strong>Thickness:</strong> the card's thickness in points. Handy for thick relics, patch cards, and 1/1s.</li>
          <li><strong>Grade:</strong> the grading company and score, like "PSA 10" or "BGS 9.5".</li>
          <li><strong>Duplicates:</strong> how many extra copies of this card you have on top of the first one.</li>
          <li><strong>Owned:</strong> whether you actually have this card. Tap or click to toggle it anytime.</li>
        </ul>
      </Section>

      <Section title="Account &amp; Settings" icon="⚙️">
        <p>Click your name in the top-right corner to get to your account settings.</p>
        <ul>
          <li>Update your name or email address anytime.</li>
          <li>Change your password. You'll need your current one to set a new one.</li>
          <li>If you forget your password, hit <strong>Forgot password?</strong> on the sign-in screen. A reset link will be sent to your email and is valid for 1 hour.</li>
        </ul>
      </Section>
    </div>
  );
}
