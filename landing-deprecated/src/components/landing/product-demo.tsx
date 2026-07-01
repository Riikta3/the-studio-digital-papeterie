import { ProductDemoViewer } from "./product-demo-viewer";

export function ProductDemo() {
  return (
    <section className="py-24 bg-background border-t border-border" style={{ overflowX: "clip" }} id="demo-viewer">
      <div className="container mx-auto px-4">
        <ProductDemoViewer />
      </div>
    </section>
  );
}
