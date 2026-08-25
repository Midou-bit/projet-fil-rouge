using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class StoreMoneyAsCents : Migration
    {
        // Migration écrite à la main (pas le AlterColumn scaffoldé par défaut) : un simple
        // AlterColumn REAL→INTEGER ferait un CAST direct côté SQLite (19.99 → 19), ce qui
        // tronquerait silencieusement toute base existante au lieu de convertir en centimes.
        // On ajoute une colonne, on la peuple via *100 arrondi, puis on bascule dessus.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            ConvertToCents(migrationBuilder, "Products", "Price");
            ConvertToCents(migrationBuilder, "Orders", "TotalPrice");
            ConvertToCents(migrationBuilder, "OrderItems", "UnitPrice");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            ConvertToReal(migrationBuilder, "Products", "Price");
            ConvertToReal(migrationBuilder, "Orders", "TotalPrice");
            ConvertToReal(migrationBuilder, "OrderItems", "UnitPrice");
        }

        private static void ConvertToCents(MigrationBuilder mb, string table, string column)
        {
            var tmp = column + "Cents";
            mb.AddColumn<long>(name: tmp, table: table, type: "INTEGER", nullable: false, defaultValue: 0L);
            mb.Sql($"UPDATE {table} SET {tmp} = CAST(ROUND({column} * 100.0) AS INTEGER);");
            mb.DropColumn(name: column, table: table);
            mb.RenameColumn(name: tmp, table: table, newName: column);
        }

        private static void ConvertToReal(MigrationBuilder mb, string table, string column)
        {
            var tmp = column + "Real";
            mb.AddColumn<double>(name: tmp, table: table, type: "REAL", nullable: false, defaultValue: 0d);
            mb.Sql($"UPDATE {table} SET {tmp} = {column} / 100.0;");
            mb.DropColumn(name: column, table: table);
            mb.RenameColumn(name: tmp, table: table, newName: column);
        }
    }
}
